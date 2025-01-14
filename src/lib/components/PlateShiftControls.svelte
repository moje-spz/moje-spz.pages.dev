<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import type { PlateCandidate, PlateData } from '../types';
	import { _ } from 'svelte-i18n';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faGripLines, faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
	import { determineShiftButtonStates } from '../plateProcessor';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		plateDataChange: PlateData;
	}>();

	export let candidate: PlateCandidate;
	export let index: number;
	export let plateId: string;
	export let plateData: PlateData;

	const LONG_PRESS_DURATION = 200; // milliseconds
	const MOVEMENT_THRESHOLD = 10; // pixels

	let touchTimer: number | null = null;
	let touchStartPosition: { x: number; y: number } | null = null;
	let dragState: {
		isDragging: boolean;
		startX: number;
		currentX: number;
		startXWithinGrip: number;
		index: number;
		element: HTMLElement | null;
		wordGroup: string | null;
		activeGripRect: DOMRect | null;
		leftGripRect: DOMRect | null;
		rightGripRect: DOMRect | null;
		leftThreshold: number | null;
		rightThreshold: number | null;
		activeIndex: number;
		isProcessingShift: boolean;
		leftEdge: number | null;
		rightEdge: number | null;
	} = {
		isDragging: false,
		startX: 0,
		currentX: 0,
		startXWithinGrip: 0,
		index: -1,
		element: null,
		wordGroup: null,
		activeGripRect: null,
		leftGripRect: null,
		rightGripRect: null,
		leftThreshold: null,
		rightThreshold: null,
		activeIndex: -1,
		isProcessingShift: false,
		leftEdge: null,
		rightEdge: null
	};

	// Replace the reactive event listener setup with a more controlled approach
	let dragEventCleanup: (() => void) | null = null;

	function setupDragEventListeners() {
		console.log('Setting up drag event listeners');
		if (dragEventCleanup) {
			console.log('Cleaning up existing event listeners before adding new ones');
			dragEventCleanup();
		}

		const handleGlobalMouseMove = (e: MouseEvent) => handleDragMove(e);
		const handleGlobalTouchMove = (e: TouchEvent) => handleDragMove(e);
		const handleGlobalEnd = (e: MouseEvent | TouchEvent) => {
			console.log('Global end event triggered', {
				type: e.type,
				target: e.target,
				currentTarget: e.currentTarget,
				buttons: e instanceof MouseEvent ? e.buttons : 'touch'
			});
			handleDragEnd();
			cleanupDragEventListeners();
		};

		// Add pointer events for more immediate response
		const handlePointerUp = (e: PointerEvent) => {
			console.log('Pointer up detected', {
				type: e.type,
				pointerType: e.pointerType,
				buttons: e.buttons
			});
			handleDragEnd();
			cleanupDragEventListeners();
		};

		// Add mouseleave to the document to catch when cursor leaves the window
		const handleMouseLeave = (e: MouseEvent) => {
			if (e.target === document.documentElement) {
				console.log('Mouse left document during drag');
				handleDragEnd();
				cleanupDragEventListeners();
			}
		};

		window.addEventListener('mousemove', handleGlobalMouseMove);
		window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
		window.addEventListener('mouseup', handleGlobalEnd);
		window.addEventListener('touchend', handleGlobalEnd);
		window.addEventListener('touchcancel', handleGlobalEnd);
		window.addEventListener('pointerup', handlePointerUp);
		document.addEventListener('mouseleave', handleMouseLeave);

		dragEventCleanup = () => {
			console.log('Cleaning up drag event listeners');
			window.removeEventListener('mousemove', handleGlobalMouseMove);
			window.removeEventListener('touchmove', handleGlobalTouchMove);
			window.removeEventListener('mouseup', handleGlobalEnd);
			window.removeEventListener('touchend', handleGlobalEnd);
			window.removeEventListener('touchcancel', handleGlobalEnd);
			window.removeEventListener('pointerup', handlePointerUp);
			document.removeEventListener('mouseleave', handleMouseLeave);
		};
	}

	function cleanupDragEventListeners() {
		if (dragEventCleanup) {
			dragEventCleanup();
			dragEventCleanup = null;
		}
	}

	function handleDragStart(event: MouseEvent | TouchEvent) {
		console.log('handleDragStart called', {
			type: event.type,
			isPadding: candidate.isPadding,
			wordGroup: candidate.wordGroup.toString(),
			target: event.target
		});

		if (candidate.isPadding) {
			return;
		}

		const target = event.target as HTMLElement;
		const x = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
		const wordGroup = candidate.wordGroup.toString();

		// Add grabbing cursor to body
		document.body.classList.add('dragging-active-cursor');

		// Find the grip-indicator element that contains the target
		const gripIndicator = target.closest('.grip-indicator');
		if (gripIndicator) {
			const rect = gripIndicator.getBoundingClientRect();
			const relativeX = x - rect.left;
			console.log('Drag start position:', {
				gripIndicatorWidth: rect.width,
				xPositionWithinGrip: relativeX,
				totalX: x,
				index,
				plateId,
				leftEdge: rect.left,
				rightEdge: rect.right
			});

			// Initialize drag state with position information
			dragState = {
				isDragging: true,
				startX: x,
				currentX: x,
				startXWithinGrip: relativeX,
				index,
				activeIndex: index,
				element: target,
				wordGroup,
				activeGripRect: rect,
				leftGripRect: null,
				rightGripRect: null,
				leftThreshold: null,
				rightThreshold: null,
				isProcessingShift: false,
				leftEdge: rect.left,
				rightEdge: rect.right
			};

			// Find and store adjacent elements
			const { leftElement, rightElement } = findAdjacentGripElements(index);
			dragState.leftGripRect = leftElement?.getBoundingClientRect() || null;
			dragState.rightGripRect = rightElement?.getBoundingClientRect() || null;

			// Calculate initial thresholds
			calculateThresholds(rect, relativeX, dragState.leftGripRect, dragState.rightGripRect);
		}

		// Clear any existing drag state and highlights first
		// First try to find the plate container by traversing up the DOM
		let currentElement: HTMLElement | null = target;
		let plateContainer: HTMLElement | null = null;
		while (currentElement && !plateContainer) {
			if (currentElement.getAttribute('data-testid') === 'plate-display-row') {
				plateContainer = currentElement;
			} else {
				currentElement = currentElement.parentElement;
			}
		}

		// If not found by traversing up, try querySelector as fallback
		if (!plateContainer) {
			plateContainer = document.querySelector('[data-testid="plate-display-row"]');
		}

		console.log('Found plate container:', {
			exists: !!plateContainer,
			element: plateContainer,
			foundBy: plateContainer === currentElement ? 'DOM traversal' : 'querySelector'
		});

		if (plateContainer) {
			const existingHighlights = plateContainer.querySelectorAll('.dragging-active');
			console.log('Found existing highlights:', {
				count: existingHighlights.length,
				elements: Array.from(existingHighlights).map((el) => el.outerHTML)
			});
			existingHighlights.forEach((el) => el.classList.remove('dragging-active'));
		}

		// Find all non-padding characters in the same word group
		const wordGroupChars = plateData.candidates.filter(
			(c: PlateCandidate) => c.wordGroup.toString() === wordGroup && !c.isPadding
		);
		const wordGroupIndices = wordGroupChars.map((c: PlateCandidate) =>
			plateData.candidates.indexOf(c)
		);

		// Add highlights only to the containers of characters in the same word group
		wordGroupIndices.forEach((charIndex: number) => {
			const selector = `[data-index="${plateId}-${charIndex}"]`;
			console.log('Looking for element with selector:', selector);
			const charElement = document.querySelector(selector);
			console.log('Found char element:', {
				exists: !!charElement,
				element: charElement,
				selector
			});
			if (charElement) {
				const container = charElement.closest('[data-testid="input-container"]');
				console.log('Found container:', {
					exists: !!container,
					element: container,
					classList: container?.classList.toString()
				});
				if (container) {
					container.classList.add('dragging-active');
					console.log('Added dragging-active class to container:', container.classList.toString());
				}
			}
		});

		// Add highlight to shift buttons of the same word group
		const buttons = document.querySelectorAll(
			`[data-word-group="${wordGroup}"] .shift-button, [data-word-group="${wordGroup}"] .shift-button-left.enabled, [data-word-group="${wordGroup}"] .shift-button-right.enabled`
		);
		buttons.forEach((button) => {
			button.classList.add('text-blue-500');
		});

		// Prevent scrolling during drag
		document.body.style.overflow = 'hidden';
		document.documentElement.style.overflow = 'hidden';
		if (event.cancelable) {
			event.preventDefault();
		}

		setupDragEventListeners();
		// Prevent text selection during drag
		event.preventDefault();
	}

	function handleDragMove(event: MouseEvent | TouchEvent) {
		console.log('handleDragMove called', {
			type: event.type,
			isDragging: dragState.isDragging,
			wordGroup: dragState.wordGroup,
			isProcessing: dragState.isProcessingShift,
			dragState
		});

		if (!dragState.isDragging || !dragState.wordGroup || dragState.isProcessingShift) {
			return;
		}

		// Prevent scrolling during drag move
		if (event.cancelable) {
			event.preventDefault();
		}

		const x = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
		dragState.currentX = x;

		// Check if shift is allowed in the direction we're moving
		const isMovingLeft = x < dragState.startX;
		const canShiftLeft = plateData.candidates.some(
			(c: PlateCandidate) => c.leftShiftState.canBeEnabled
		);
		const canShiftRight = plateData.candidates.some(
			(c: PlateCandidate) => c.rightShiftState.canBeEnabled
		);

		// Update cursor based on movement direction, shift possibility, and edge thresholds
		const isBeyondLeftEdge = dragState.leftEdge !== null && x < dragState.leftEdge;
		const isBeyondRightEdge = dragState.rightEdge !== null && x > dragState.rightEdge;

		// Check if we're moving in an allowed direction
		const isMovingInAllowedDirection =
			(isMovingLeft && canShiftLeft) || (!isMovingLeft && canShiftRight);

		if (isMovingInAllowedDirection) {
			// If moving in allowed direction, always show grabbing cursor
			document.body.classList.add('dragging-active-cursor');
			document.body.classList.remove('dragging-blocked-cursor');
		} else if ((isBeyondLeftEdge && !canShiftLeft) || (isBeyondRightEdge && !canShiftRight)) {
			// Only show blocked cursor if beyond edge in disallowed direction
			document.body.classList.remove('dragging-active-cursor');
			document.body.classList.add('dragging-blocked-cursor');
		}

		// Check if we've crossed any thresholds
		if (dragState.leftThreshold !== null && x <= dragState.leftThreshold && canShiftLeft) {
			console.log('Left threshold crossed', {
				currentX: x,
				threshold: dragState.leftThreshold,
				currentIndex: dragState.activeIndex
			});

			// Set processing lock
			dragState.isProcessingShift = true;

			// Trigger the shift
			const shiftableCandidate = plateData.candidates.find(
				(c: PlateCandidate) => c.leftShiftState.canBeEnabled
			);
			if (shiftableCandidate) {
				const shiftIndex = plateData.candidates.indexOf(shiftableCandidate);
				handleShiftButtonClick(shiftIndex, true);
			}

			// Update the index for the next potential shift
			const newIndex = dragState.activeIndex - 1;
			console.log('Updating index after left shift:', {
				oldIndex: dragState.activeIndex,
				newIndex
			});

			// Reset state for movement to the left
			resetDragState(newIndex, x);

			// Get new cursor position after state reset
			const newX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
			dragState.currentX = newX;
			updateDragPositions(newX);

			// Release processing lock
			dragState.isProcessingShift = false;
			return;
		}

		if (dragState.rightThreshold !== null && x >= dragState.rightThreshold && canShiftRight) {
			console.log('Right threshold crossed', {
				currentX: x,
				threshold: dragState.rightThreshold,
				currentIndex: dragState.activeIndex
			});

			// Set processing lock
			dragState.isProcessingShift = true;

			// Trigger the shift
			const shiftableCandidate = plateData.candidates.find(
				(c: PlateCandidate) => c.rightShiftState.canBeEnabled
			);
			if (shiftableCandidate) {
				const shiftIndex = plateData.candidates.indexOf(shiftableCandidate);
				handleShiftButtonClick(shiftIndex, false);
			}

			// Update the index for the next potential shift
			const newIndex = dragState.activeIndex + 1;
			console.log('Updating index after right shift:', {
				oldIndex: dragState.activeIndex,
				newIndex
			});

			// Reset state for movement to the right
			resetDragState(newIndex, x);

			// Get new cursor position after state reset
			const newX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
			dragState.currentX = newX;
			updateDragPositions(newX);

			// Release processing lock
			dragState.isProcessingShift = false;
			return;
		}

		// Update positions and thresholds
		updateDragPositions(x);
	}

	function triggerShift(isLeft: boolean) {
		const shiftableCandidate = plateData.candidates.find((c: PlateCandidate) =>
			isLeft ? c.leftShiftState.canBeEnabled : c.rightShiftState.canBeEnabled
		);

		console.log('Attempting shift:', {
			direction: isLeft ? 'left' : 'right',
			foundShiftableCandidate: !!shiftableCandidate,
			candidate: shiftableCandidate
		});

		if (shiftableCandidate) {
			const shiftIndex = plateData.candidates.indexOf(shiftableCandidate);
			handleShiftButtonClick(shiftIndex, isLeft);
		}
	}

	function handleDragEnd() {
		console.log('handleDragEnd called', {
			isDragging: dragState.isDragging,
			wordGroup: dragState.wordGroup,
			activeIndex: dragState.activeIndex,
			originalIndex: dragState.index,
			isProcessing: dragState.isProcessingShift
		});

		// If we're processing a shift, wait for it to complete
		if (dragState.isProcessingShift) {
			return;
		}

		if (dragState.isDragging) {
			// If we ended on a different index than we started, trigger the shift
			if (dragState.activeIndex !== dragState.index) {
				const isLeft = dragState.activeIndex < dragState.index;
				triggerShift(isLeft);
			}

			// Remove visual feedback classes
			const plateContainer = document.querySelector('[data-testid="plate-display-row"]');
			if (plateContainer) {
				const elements = plateContainer.querySelectorAll('.dragging-active');
				elements.forEach((el) => el.classList.remove('dragging-active'));
				console.log('Removed dragging-active classes');
			}

			// Remove highlight from shift buttons
			if (dragState.wordGroup) {
				const buttons = document.querySelectorAll(
					`[data-word-group="${dragState.wordGroup}"] .shift-button, [data-word-group="${dragState.wordGroup}"] .shift-button-left.enabled, [data-word-group="${dragState.wordGroup}"] .shift-button-right.enabled`
				);
				buttons.forEach((button) => {
					button.classList.remove('text-blue-500');
				});
			}

			// Remove cursor classes
			document.body.classList.remove('dragging-active-cursor');
			document.body.classList.remove('dragging-blocked-cursor');

			// Re-enable scrolling
			document.body.style.overflow = '';
			document.documentElement.style.overflow = '';
		}

		dragState = {
			isDragging: false,
			startX: 0,
			currentX: 0,
			startXWithinGrip: 0,
			index: -1,
			activeIndex: -1,
			element: null,
			wordGroup: null,
			activeGripRect: null,
			leftGripRect: null,
			rightGripRect: null,
			leftThreshold: null,
			rightThreshold: null,
			isProcessingShift: false,
			leftEdge: null,
			rightEdge: null
		};
		cleanupDragEventListeners();
	}

	function handleTouchStart(event: TouchEvent) {
		// Clear any existing touch state
		if (touchTimer !== null) {
			clearTimeout(touchTimer);
			touchTimer = null;
		}

		// Store initial touch position
		touchStartPosition = {
			x: event.touches[0].clientX,
			y: event.touches[0].clientY
		};

		// Start timer for potential drag
		touchTimer = window.setTimeout(() => {
			// Only start drag if we haven't moved much (not scrolling)
			if (touchStartPosition) {
				const touch = event.touches[0];
				const deltaX = Math.abs(touch.clientX - touchStartPosition.x);
				const deltaY = Math.abs(touch.clientY - touchStartPosition.y);

				if (deltaX < MOVEMENT_THRESHOLD && deltaY < MOVEMENT_THRESHOLD) {
					handleDragStart(event);
				}
			}
		}, LONG_PRESS_DURATION);

		// Prevent default to avoid text selection
		if (event.cancelable) {
			event.preventDefault();
		}
	}

	function handleTouchMove(event: TouchEvent) {
		if (!touchStartPosition) {
			return;
		}

		const touch = event.touches[0];
		const deltaX = Math.abs(touch.clientX - touchStartPosition.x);
		const deltaY = Math.abs(touch.clientY - touchStartPosition.y);

		// If significant movement detected, cancel the timer
		if (deltaX > MOVEMENT_THRESHOLD || deltaY > MOVEMENT_THRESHOLD) {
			if (touchTimer) {
				clearTimeout(touchTimer);
				touchTimer = null;
			}
		}

		// If we're already dragging, let handleDragMove handle it
		if (dragState.isDragging) {
			handleDragMove(event);
		}

		// Prevent default if we're dragging
		if (dragState.isDragging && event.cancelable) {
			event.preventDefault();
		}
	}

	function getShiftButtonTooltip(disabledReason: string, isLeft: boolean): string {
		if (disabledReason === 'boundaryReached') {
			return isLeft
				? $_('plateDisplay.shiftButton.boundaryReachedLeft')
				: $_('plateDisplay.shiftButton.boundaryReachedRight');
		} else if (disabledReason === 'nonPaddingCharFound') {
			return isLeft
				? $_('plateDisplay.shiftButton.nonPaddingCharFoundLeft')
				: $_('plateDisplay.shiftButton.nonPaddingCharFoundRight');
		}
		return '';
	}

	function getPlateCharWidth(): number {
		const plateCharWidth = getComputedStyle(document.documentElement)
			.getPropertyValue('--plate-char-width')
			.trim();
		const remValue = parseFloat(plateCharWidth);
		const fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

		console.log('Getting plate char width:', {
			plateCharWidth,
			remValue,
			fontSize,
			computed: remValue * fontSize
		});

		return remValue * fontSize;
	}

	function handleShiftButtonClick(index: number, isLeft: boolean) {
		const candidate = plateData.candidates[index];

		console.log('Shift button clicked - detailed state:', {
			index,
			direction: isLeft ? 'left' : 'right',
			candidateDetails: {
				value: candidate?.selected,
				isPadding: candidate?.isPadding,
				wordGroup: candidate?.wordGroup,
				alternatives: candidate?.alternatives,
				input: candidate?.input
			},
			plateDataState: plateData.candidates.map((c, i) => ({
				index: i,
				value: c.selected,
				isPadding: c.isPadding,
				wordGroup: c.wordGroup
			}))
		});

		if (!candidate) {
			console.log('Shift cancelled: Invalid candidate', {
				candidateExists: !!candidate
			});
			return;
		}

		// Get the word group of the current character
		const wordGroup = candidate.wordGroup;

		// Find the padding character to move
		const paddingIndex = isLeft ? index - 1 : index + 1;
		const adjacentChar = plateData.candidates[paddingIndex];
		console.log('Adjacent character check:', {
			paddingIndex,
			adjacentChar,
			isPadding: adjacentChar?.isPadding
		});

		// If we clicked on a non-padding character, look for padding in the adjacent position
		if (!candidate.isPadding) {
			if (!adjacentChar || !adjacentChar.isPadding) {
				console.log('Shift cancelled: No padding character found in adjacent position');
				return;
			}
		} else {
			// If we clicked on a padding character, look for non-padding in the adjacent position
			if (!adjacentChar || adjacentChar.isPadding) {
				console.log('Shift cancelled: No non-padding character found in adjacent position');
				return;
			}
		}

		// Create a new array for candidates to ensure reactivity
		let newCandidates = [...plateData.candidates];

		// Determine which character is padding and which is non-padding
		const paddingChar = candidate.isPadding ? candidate : adjacentChar;
		const nonPaddingChar = candidate.isPadding ? adjacentChar : candidate;
		const nonPaddingIndex = candidate.isPadding ? paddingIndex : index;

		// Remove the padding character from its current position
		const removeIndex = candidate.isPadding ? index : paddingIndex;
		newCandidates.splice(removeIndex, 1);
		console.log('Removed padding character at index:', removeIndex);

		// Find the target position to insert the padding
		if (isLeft) {
			// Find rightmost character of the same word group
			let targetIndex = nonPaddingIndex;
			while (targetIndex < newCandidates.length) {
				const currentChar = newCandidates[targetIndex];
				if (!currentChar.isPadding && currentChar.wordGroup === wordGroup) {
					targetIndex++;
				} else {
					break;
				}
			}
			console.log('Left shift: Inserting padding at index:', targetIndex);
			// Insert padding after the last character of the word group
			newCandidates.splice(targetIndex, 0, paddingChar);
		} else {
			// Find leftmost character of the same word group
			let targetIndex = nonPaddingIndex;
			while (targetIndex >= 0) {
				const currentChar = newCandidates[targetIndex];
				if (!currentChar.isPadding && currentChar.wordGroup === wordGroup) {
					targetIndex--;
				} else {
					break;
				}
			}
			console.log('Right shift: Inserting padding at index:', targetIndex + 1);
			// Insert padding before the first character of the word group
			newCandidates.splice(targetIndex + 1, 0, paddingChar);
		}

		// Recalculate shift button states
		determineShiftButtonStates(newCandidates);

		// Create a new plateData object to ensure reactivity
		const newPlateData = {
			...plateData,
			candidates: newCandidates
		};

		// Update local state
		plateData = newPlateData;

		// Notify parent component
		dispatch('plateDataChange', newPlateData);

		console.log('Shift completed. New plate state:', {
			candidates: newPlateData.candidates.map((c, i) => ({
				index: i,
				char: c.selected,
				wordGroup: c.wordGroup,
				isPadding: c.isPadding
			}))
		});
	}

	function handleMouseEnter(event: MouseEvent) {
		const target = event.currentTarget as HTMLElement;
		const wordGroup = target.getAttribute('data-word-group');
		if (!wordGroup) return;

		// Find all shift buttons with the same word group
		const buttons = document.querySelectorAll(
			`[data-word-group="${wordGroup}"] .shift-button, [data-word-group="${wordGroup}"] .shift-button-left.enabled, [data-word-group="${wordGroup}"] .shift-button-right.enabled`
		);
		buttons.forEach((button) => {
			button.classList.add('text-blue-500');
		});
	}

	function handleMouseLeave(event: MouseEvent) {
		const target = event.currentTarget as HTMLElement;
		const wordGroup = target.getAttribute('data-word-group');
		if (!wordGroup) return;

		// Remove highlight from all shift buttons with the same word group
		const buttons = document.querySelectorAll(
			`[data-word-group="${wordGroup}"] .shift-button, [data-word-group="${wordGroup}"] .shift-button-left.enabled, [data-word-group="${wordGroup}"] .shift-button-right.enabled`
		);
		buttons.forEach((button) => {
			button.classList.remove('text-blue-500');
		});
	}

	function findAdjacentGripElements(currentIndex: number) {
		// First list all shift-controls-wrapper elements
		const allWrappers = document.querySelectorAll('[data-testid="shift-controls-wrapper"]');
		console.log('All shift controls wrappers:', {
			count: allWrappers.length,
			elements: Array.from(allWrappers).map((el) => ({
				hasDataIndex: el.hasAttribute('data-index'),
				dataIndex: el.getAttribute('data-index'),
				classList: el.classList.toString(),
				html: el.outerHTML
			}))
		});

		// Construct and show full queries
		const leftQuery = `[data-testid="shift-controls-wrapper"][data-index="${plateId}-${currentIndex - 1}"]`;
		const rightQuery = `[data-testid="shift-controls-wrapper"][data-index="${plateId}-${currentIndex + 1}"]`;

		console.log('Attempting to find elements with queries:', {
			leftQuery,
			rightQuery,
			currentIndex,
			plateId
		});

		const leftElement = document.querySelector(leftQuery);
		const rightElement = document.querySelector(rightQuery);

		console.log('Found adjacent elements:', {
			currentIndex,
			leftElement: {
				exists: !!leftElement,
				element: leftElement,
				index: currentIndex - 1,
				query: leftQuery
			},
			rightElement: {
				exists: !!rightElement,
				element: rightElement,
				index: currentIndex + 1,
				query: rightQuery
			}
		});

		if (!leftElement && !rightElement) {
			console.warn('No adjacent elements found - this should not happen:', {
				currentIndex,
				plateId,
				allWrapperCount: allWrappers.length,
				queries: {
					left: leftQuery,
					right: rightQuery
				}
			});
		}

		return { leftElement, rightElement };
	}

	function calculateThresholds(
		activeRect: DOMRect,
		relativeX: number,
		leftRect: DOMRect | null,
		rightRect: DOMRect | null
	) {
		// TODO: Consider proportional calculation if widths are different between elements
		if (leftRect) {
			const leftAbsoluteX = leftRect.left + relativeX;
			dragState.leftThreshold = leftAbsoluteX;
		}
		if (rightRect) {
			const rightAbsoluteX = rightRect.left + relativeX;
			dragState.rightThreshold = rightAbsoluteX;
		}

		console.log('Calculated thresholds:', {
			leftThreshold: dragState.leftThreshold,
			rightThreshold: dragState.rightThreshold,
			activeRectWidth: activeRect.width,
			leftRectWidth: leftRect?.width,
			rightRectWidth: rightRect?.width,
			relativeX
		});
	}

	function updateDragPositions(currentX: number) {
		const relativeX = dragState.startXWithinGrip;

		console.log('Updating drag positions:', {
			currentX,
			relativeX,
			activeIndex: dragState.activeIndex,
			activeRect: dragState.activeGripRect,
			leftRect: dragState.leftGripRect,
			rightRect: dragState.rightGripRect
		});

		if (dragState.activeGripRect) {
			const { leftElement, rightElement } = findAdjacentGripElements(dragState.activeIndex);

			dragState.leftGripRect = leftElement?.getBoundingClientRect() || null;
			dragState.rightGripRect = rightElement?.getBoundingClientRect() || null;

			calculateThresholds(
				dragState.activeGripRect,
				relativeX,
				dragState.leftGripRect,
				dragState.rightGripRect
			);
		}
	}

	function resetDragState(newIndex: number, currentX: number) {
		console.log('Resetting drag state for new index:', {
			previousIndex: dragState.activeIndex,
			newIndex,
			currentX,
			oldBaseIndex: dragState.index,
			wordGroup: dragState.wordGroup
		});

		dragState.activeIndex = newIndex;
		dragState.index = newIndex; // Update the base index to match the new position
		const gripIndicator = document.querySelector(
			`[data-index="${plateId}-${newIndex}"] .grip-indicator`
		);

		if (gripIndicator) {
			dragState.activeGripRect = gripIndicator.getBoundingClientRect();
			dragState.startXWithinGrip = dragState.startXWithinGrip; // Maintain the same relative position
			updateDragPositions(currentX);

			// Reapply highlights after shift
			if (dragState.wordGroup) {
				// Clear any existing highlights first
				const plateContainer = document.querySelector('[data-testid="plate-display-row"]');
				if (plateContainer) {
					const existingHighlights = plateContainer.querySelectorAll('.dragging-active');
					existingHighlights.forEach((el) => el.classList.remove('dragging-active'));
				}

				// Find all non-padding characters in the same word group
				const wordGroupChars = plateData.candidates.filter(
					(c: PlateCandidate) => c.wordGroup.toString() === dragState.wordGroup && !c.isPadding
				);
				const wordGroupIndices = wordGroupChars.map((c: PlateCandidate) =>
					plateData.candidates.indexOf(c)
				);

				// Add highlights to the containers of characters in the same word group
				wordGroupIndices.forEach((charIndex: number) => {
					const charElement = document.querySelector(`[data-index="${plateId}-${charIndex}"]`);
					if (charElement) {
						const container = charElement.closest('[data-testid="input-container"]');
						if (container) {
							container.classList.add('dragging-active');
						}
					}
				});

				// Reapply highlight to shift buttons
				const buttons = document.querySelectorAll(
					`[data-word-group="${dragState.wordGroup}"] .shift-button, [data-word-group="${dragState.wordGroup}"] .shift-button-left.enabled, [data-word-group="${dragState.wordGroup}"] .shift-button-right.enabled`
				);
				buttons.forEach((button) => {
					button.classList.add('text-blue-500');
				});
			}
		}
	}
</script>

{#if candidate.isPadding}
	<div
		class="row-start-[shift-controls] col-span-2"
		data-index="{plateId}-{index}"
		data-testid="shift-controls-wrapper"
	></div>
{:else}
	<div
		class="row-start-[shift-controls] col-span-2 grip-indicator w-full"
		data-index="{plateId}-{index}"
		data-word-group={candidate.wordGroup}
		data-testid="shift-controls-wrapper"
		role="group"
		aria-label={$_('plateDisplay.dragToShift')}
		on:mouseenter={handleMouseEnter}
		on:mouseleave={handleMouseLeave}
	>
		{#if !candidate.wordGroupBoundaryLeft && !candidate.wordGroupBoundaryRight}
			<div class="flex items-end justify-center w-full">
				<div
					class="w-full shift-button cursor-grab"
					role="button"
					tabindex="0"
					aria-label={$_('plateDisplay.dragToShift')}
					data-word-group={candidate.wordGroup}
					on:mousedown={handleDragStart}
					on:touchstart|nonpassive={handleTouchStart}
					on:touchmove|nonpassive={handleTouchMove}
				>
					<FontAwesomeIcon icon={faGripLines} class="w-full h-full shift-button-svg" size="lg" />
				</div>
			</div>
		{:else}
			<div class="grid w-full grid-cols-3">
				<div class="flex items-end justify-center w-full">
					{#if candidate.wordGroupBoundaryLeft}
						<button
							type="button"
							class="shift-button-left w-full h-full {candidate.leftShiftState.canBeEnabled
								? 'enabled cursor-pointer'
								: 'disabled'}"
							title={!candidate.leftShiftState.canBeEnabled &&
							candidate.leftShiftState.disabledReason
								? getShiftButtonTooltip(candidate.leftShiftState.disabledReason, true)
								: undefined}
							data-word-group={candidate.wordGroup}
							on:click={() => {
								if (candidate.leftShiftState.canBeEnabled) {
									handleShiftButtonClick(index, true);
								}
							}}
							on:keydown={(e) => {
								if ((e.key === 'Enter' || e.key === ' ') && candidate.leftShiftState.canBeEnabled) {
									handleShiftButtonClick(index, true);
								}
							}}
							disabled={!candidate.leftShiftState.canBeEnabled}
						>
							<FontAwesomeIcon icon={faArrowLeft} class="w-full h-full" />
						</button>
					{/if}
				</div>
				<div class="flex items-end justify-center w-full">
					<div
						class="w-full shift-button cursor-grab"
						role="button"
						tabindex="0"
						aria-label={$_('plateDisplay.dragToShift')}
						data-word-group={candidate.wordGroup}
						on:mousedown={handleDragStart}
						on:touchstart|nonpassive={handleTouchStart}
						on:touchmove|nonpassive={handleTouchMove}
					>
						<FontAwesomeIcon icon={faGripLines} class="w-full h-full shift-button-svg" size="lg" />
					</div>
				</div>
				<div class="flex items-end justify-center w-full">
					{#if candidate.wordGroupBoundaryRight}
						<button
							type="button"
							class="shift-button-right w-full {candidate.rightShiftState.canBeEnabled
								? 'enabled cursor-pointer'
								: 'disabled'}"
							title={!candidate.rightShiftState.canBeEnabled &&
							candidate.rightShiftState.disabledReason
								? getShiftButtonTooltip(candidate.rightShiftState.disabledReason, false)
								: undefined}
							data-word-group={candidate.wordGroup}
							on:click={() => {
								if (candidate.rightShiftState.canBeEnabled) {
									handleShiftButtonClick(index, false);
								}
							}}
							on:keydown={(e) => {
								if (
									(e.key === 'Enter' || e.key === ' ') &&
									candidate.rightShiftState.canBeEnabled
								) {
									handleShiftButtonClick(index, false);
								}
							}}
							disabled={!candidate.rightShiftState.canBeEnabled}
						>
							<FontAwesomeIcon icon={faArrowRight} class="w-full h-full" />
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}

{#if index === 2}
	<div class="row-start-[shift-controls]" data-testid="shift-controls-separator"></div>
{/if}

<style>
	/* Keep indicator styles */
	.grip-indicator {
		color: rgb(156 163 175);
		height: 1rem;
		margin-bottom: 0.25rem;
		display: flex;
		justify-content: center;
		align-items: flex-end;
	}

	:global(.dark) .grip-indicator {
		color: rgb(75 85 99);
	}

	/* Add shift button styles */
	.shift-button {
		width: calc(var(--plate-char-width) / 3);
		height: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.shift-button.w-full {
		width: 100%;
	}

	/* Add dragging cursor styles */
	:global(body.dragging-active-cursor) {
		cursor: grabbing !important;
		user-select: none;
	}

	:global(body.dragging-active-cursor *) {
		cursor: grabbing !important;
	}

	/* Add blocked cursor styles */
	:global(body.dragging-blocked-cursor) {
		cursor: not-allowed !important;
		user-select: none;
	}

	:global(body.dragging-blocked-cursor *) {
		cursor: not-allowed !important;
	}

	.shift-button:active {
		@apply cursor-grabbing;
	}

	.shift-button :global(.shift-button-svg) {
		width: 100%;
		height: 0.5rem;
		aspect-ratio: 448/256;
		transform: scale(2); /* Make the icon larger while maintaining its position */
		display: block;
	}

	/* Add shift button arrow styles */
	.shift-button-left,
	.shift-button-right {
		width: calc(var(--plate-char-width) / 3);
		height: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.shift-button-left.disabled,
	.shift-button-right.disabled {
		opacity: 0.5;
	}

	/* Add dragging styles */
	:global(.dragging-active) {
		background-color: rgba(59, 130, 246, 0.1); /* bg-blue-500 with 0.1 opacity */
		border-radius: 0.375rem; /* rounded-md */
		transition: background-color 0.2s ease-in-out;
	}

	:global(.dark) :global(.dragging-active) {
		background-color: rgba(96, 165, 250, 0.1); /* dark:bg-blue-400 with 0.1 opacity */
	}

	/* Add word group hover styles */
	:global([data-word-group]:has(.shift-button:hover))
		:is(.shift-button, .shift-button-left.enabled, .shift-button-right.enabled),
	:global([data-word-group]:has(.shift-button-left.enabled:hover))
		:is(.shift-button, .shift-button-left.enabled, .shift-button-right.enabled),
	:global([data-word-group]:has(.shift-button-right.enabled:hover))
		:is(.shift-button, .shift-button-left.enabled, .shift-button-right.enabled),
	/* Add styles for dragging state */
	:global(body.dragging-active-cursor) :global([data-word-group]:has(.shift-button))
		:is(.shift-button, .shift-button-left.enabled, .shift-button-right.enabled) {
		@apply text-blue-500;
	}
</style>
