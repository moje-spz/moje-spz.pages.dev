# My Czech Registration Plate

A web application to help users to create custom registration
plates for vehicles in the Czech Republic.

The application will automatically:

- Convert text to uppercase for plate display
- Visually divide the plate into two parts (3 and 5 positions)
- Remove diacritics from letters
- Skip symbols and whitespace
- Convert certain letters to numbers (O→0, G→6, Q→6, W→3)
- Ensure at least one number in the plate
- Try to avoid plates starting with "EL"
- Pad input shorter than 8 characters with additional characters
- Try to shorten input longer than 8 characters by omitting vowels
- Check availability against the database

The application does not verify:

- Whether the plate contains offensive or objectionable expressions
- If the same registration plate is assigned to another vehicle
- Requirements for motorcycle plates (7 characters) and moped plates (5 characters)

For official registration of your registration plate, please visit the
[Registrační značka na přání on the Public administration portal](https://pruvodce.gov.cz/porizeni-vozidla/registracni-znacka-na-prani).

For detailed development instructions, see [DEVELOPERS.md](DEVELOPERS.md).

## Conversion and transformation rules

When input is not long enough for a full plate, it is padded with additional
characters. By default padding characters are first letter in the alphabet ("A") and added to the right of the input.

When input is longer than 8 characters, it is shortened by omitting vowels. Omitted vowels are displayed below the plate number display.

If the input does not contain any letter, the first number ("0") is selected on the right most padding char.

If the input starts with "EL" and its length is smaller than 8 characters, padding character is added before the first letter.

If the input starts with "EL" and its length is 8 characters, the number "3" is added instead of "E". This is to avoid the plate number starting with "EL" which is not allowed. Additionally it places a requirement to have at least one number in the plate.

If input contains spaces or other symbols, letters and numbers are considered word groups. Word groups are not separable and if total length of the word group chars is less than 8 a padding is added between word groups. Padding char are preferrably added between earlier word groups.

Special handling applies to 5-character groups:

- If the input consists of exactly 5 characters that belong to the same word group, three padding characters are added at the start.
- If the input consists of a single character followed by a 5-character word group (e.g., "X 12345"), two padding characters are added between them, resulting in the 5-character group being placed at the end (e.g., "XAA12345").
- This special handling does not apply if the input starts with "EL" or if the 5-character group is not at the end of the input.

## License

The project uses [REUSE](https://reuse.software/) to manage licenses.
Summary of licenses:

- Code is licensed under the [MIT License](LICENSES/MIT.txt)
- Documentation is licensed under the [CC-BY-4.0 License](LICENSES/CC-BY-4.0.txt)
- Majority of icons comes from [Font Awesome](https://fontawesome.com/). All icons are licensed under [CC-BY-4.0 License](LICENSES/CC-BY-4.0.txt).
- Trivial parts of the code are licensed under the
  [CC0-1.0 License](LICENSES/CC0-1.0.txt)
