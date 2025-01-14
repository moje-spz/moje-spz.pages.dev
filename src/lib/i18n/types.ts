export interface I18nMessages {
    app: {
        title: string;
        slogan: string;
    };
    inputSection: {
        addPlateDisabledTitle: string;
    };
    input: {
        plate: string;
        placeholder: string;
        multiline: {
            title: string;
            placeholder: string;
            submit: string;
        };
    };
    saved: Record<string, unknown>;
    about: Record<string, unknown>;
    menu: Record<string, unknown>;
    themeToggle: {
        label: string;
        auto: string;
        light: string;
        dark: string;
    };
    resultsSection: Record<string, unknown>;
    savedPlates: Record<string, unknown>;
    aboutModal: {
        title: string;
        button: string;
        footer: {
            madeIn: string;
            sourceCode: string;
            aboutLink: string;
            plateDataDate: string;
            uploadPlateData: string;
        };
        portalLink: {
            prefix: string;
            linkText: string;
            url: string;
            postfix: string;
        };
    };
    plateAvailability: {
        noData: {
            text: string;
            button: string;
            suffix: string;
        };
        hasData: {
            text: string;
            button: string;
            suffix: string;
        };
    };
    csvUpload: {
        title: string;
        dropInstructions: string;
        instructions: {
            intro: string;
            linkText: string;
            url: string;
            outro: string;
        };
        selectFile: string;
        existingData: string;
        uploadedData: string;
        lastEntry: string;
        fileHash: string;
        clearData: string;
        sameDataWarning: string;
        olderDataWarning: string;
        overwriteButton: string;
        or: string;
        browse: string;
    };
}
