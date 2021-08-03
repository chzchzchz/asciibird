import LZString from "lz-string";
import store from "./store";

export const parseMircAscii = (content, title) => {
    const MIRC_MAX_COLOURS = mircColours99.length;

    // The current state of the Colours
    let curBlock = {
      fg: null,
      bg: null,
      char: null,
    };

    let contents = content
    let filename = title

    // set asciiImport as the entire file contents as a string
    const asciiImport = contents
      .split("\u0003\u0003")
      .join("\u0003")
      .split("\u000F").join("")
      .split("\u0003\n").join("\n")
      .split("\u0002\u0003").join("\u0003");

    // This will end up in the asciibirdMeta
    const finalAscii = {
      width: false, // defined in: switch (curChar) case "\n":
      height: asciiImport.split("\n").length,
      title: filename,
      key: store.getters.nextTabValue,
      blockWidth: 8 * store.getters.blockSizeMultiplier,
      blockHeight: 13 * store.getters.blockSizeMultiplier,
      blocks: create2DArray(asciiImport.split("\n").length),
      history: [],
      redo: [],
      x: 8 * 35, // the dragable ascii canvas x
      y: 13 * 2, // the dragable ascii canvas y
    };

    // Turn the entire ascii string into an array
    let asciiStringArray = asciiImport.split("");
    let linesArray = asciiImport.split("\n");

    // The proper X and Y value of the block inside the ASCII
    let asciiX = 0;
    let asciiY = 0;

    // used to determine colours
    let colourChar1 = null;
    let colourChar2 = null;
    let parsedColour = null;

    // This variable just counts the amount of colour and char codes to minus
    // to get the real width
    let widthOfColCodes = 0;

    // Better for colourful asciis
    let maxWidthLoop = 0;

    // Used before the loop, better for plain text
    let maxWidthFound = 0;

    for (let i = 0; i < linesArray.length; i++) {
      if (linesArray[i].length > maxWidthFound) {
        maxWidthFound = linesArray[i].length;
      }
    }

    while (asciiStringArray.length) {
      const curChar = asciiStringArray[0];

      // Defining a small finite state machine
      // to detect the colour code
      switch (curChar) {
        case "\n":
          // Reset the colours here on a new line
          curBlock = {
            fg: null,
            bg: null,
            char: null,
          };

          if (linesArray[asciiY] && linesArray[asciiY].length > maxWidthLoop) {
            maxWidthLoop = linesArray[asciiY].length;
          }

          // the Y value of the ascii
          asciiY++;

          // Calculate widths mirc asciis vs plain text
          if (!finalAscii.width && widthOfColCodes > 0) {
            finalAscii.width =
              maxWidthLoop - widthOfColCodes; // minus \n for the proper width
          }


          if (!finalAscii.width && widthOfColCodes === 0) {
            // Plain text
            finalAscii.width =
              maxWidthFound; // minus \n for the proper width
          }

          // Resets the X value
          asciiX = 0;

          asciiStringArray.shift();
          widthOfColCodes = 0;
          break;

        case "\u0003":
          // Remove the colour char
          asciiStringArray.shift();
          widthOfColCodes++;

          // Attempt to work out bg
          colourChar1 = `${asciiStringArray[0]}`;
          colourChar2 = `${asciiStringArray[1]}`;
          parsedColour = parseInt(`${colourChar1}${colourChar2}`);

          // Work out the 01, 02 double digit codes
          if (parseInt(colourChar1) === 0 && parseInt(colourChar2) >= 0) {
            asciiStringArray.shift();
          }

          if (isNaN(parsedColour)) {
            curBlock.bg = parseInt(colourChar1);
            widthOfColCodes += 1;
            asciiStringArray.shift();
          } else if (parsedColour <= MIRC_MAX_COLOURS && parsedColour >= 0) {
            curBlock.fg = parseInt(parsedColour);
            widthOfColCodes += parsedColour.toString().length;

            asciiStringArray = asciiStringArray.slice(
              parsedColour.toString().length,
              asciiStringArray.length
            );
          }

          // No background colour
          if (asciiStringArray[0] !== ",") {
            break;
          } else {
            // Remove , from array
            widthOfColCodes += 1;
            asciiStringArray.shift();
          }

          // Attempt to work out bg
          colourChar1 = `${asciiStringArray[0]}`;
          colourChar2 = `${asciiStringArray[1]}`;
          parsedColour = parseInt(`${colourChar1}${colourChar2}`);

          if (
            !isNaN(colourChar1) &&
            !isNaN(colourChar2) &&
            parseInt(colourChar2) > parseInt(colourChar1) &&
            !isNaN(parsedColour) &&
            parseInt(parsedColour) < 10
          ) {
            parsedColour = parseInt(colourChar2);
            widthOfColCodes += 1;
            asciiStringArray.shift();
          }

          if (
            parseInt(colourChar2) === parseInt(colourChar1) &&
            parseInt(parsedColour) < 10
          ) {
            parsedColour = parseInt(colourChar1);
            asciiStringArray.shift();
            asciiStringArray.shift();
            widthOfColCodes += 2;

            curBlock.bg = parseInt(colourChar1);

            break;
          }

          if (isNaN(parsedColour)) {
            curBlock.bg = parseInt(colourChar1);
            widthOfColCodes += 1;
            asciiStringArray.shift();
          } else if (parsedColour <= MIRC_MAX_COLOURS && parsedColour >= 0) {
            curBlock.bg = parseInt(parsedColour);
            widthOfColCodes += parsedColour.toString().length;

            asciiStringArray = asciiStringArray.slice(
              parsedColour.toString().length,
              asciiStringArray.length
            );

            break;
          }

          break;

        default:
          curBlock.char = curChar;
          asciiStringArray.shift();
          asciiX++;

          finalAscii.blocks[asciiY][asciiX - 1] = {
            ...curBlock
          };
          break;
      } // End Switch
    } // End loop charPos

    // Store the ASCII
    finalAscii.blocks = LZString.compressToUTF16(
      JSON.stringify(finalAscii.blocks)
    );
    finalAscii.history.push(finalAscii.blocks);

    store.commit("newAsciibirdMeta", finalAscii);

    // Update the browsers title to the ASCII filename
    document.title = `asciibird - ${store.getters.currentAscii.title}`;

    return true;

  };

  export const create2DArray = (rows) => {
      const arr = [];

      for (let i = 0; i < rows; i++) {
        arr[i] = [];
      }

      return arr;
  }

  export const emptyBlock = {
        bg: null,
        fg: null,
        char: null,
      };

  export const createNewAscii = (forms) => {
      let newAscii = {
        title: forms.createAscii.title,
        key: store.getters.asciibirdMeta.length,
        width: forms.createAscii.width,
        height: forms.createAscii.height,
        blockWidth: 8,
        blockHeight: 13,
        history: [],
        redo: [],
        x: 247, // the dragable ascii canvas x
        y: 24, // the dragable ascii canvas y
        blocks: create2DArray(forms.createAscii.height),
      };

      // Push all the default ASCII blocks
      for (let x = 0; x < newAscii.width; x++) {
        for (let y = 0; y < newAscii.height; y++) {
          newAscii.blocks[y].push({
            bg: null,
            fg: null,
            char: null,
          });
        }
      }

      newAscii.blocks = LZString.compressToUTF16(JSON.stringify(newAscii.blocks))
      newAscii.history.push(newAscii.blocks)
      store.commit("newAsciibirdMeta", newAscii);
      store.commit('openModal', 'new-ascii');

      return true;
  }

  // 0  => 'white',
  // 1  => 'black',
  // 2  => 'navy',
  // 3  => 'green',
  // 4  => 'red',
  // 5  => 'brown',
  // 6  => 'purple',
  // 7  => 'olive',
  // 8  => 'yellow',                  # dark yellow
  // 9  => 'lime',                  # ltgreen
  // 10 => 'teal',
  // 11 => 'cyan',
  // 12 => 'blue',                  # ltblue,
  // 13 => 'fuchsia',                  # pink
  // 14 => 'grey',
  // 15 => 'lightgrey',
  export const mircColours99 = [
    'rgb(255,255,255)',
    'rgb(0,0,0)',
    'rgb(0,0,127)',
    'rgb(0,147,0)',
    'rgb(255,0,0)',
    'rgb(127,0,0)',
    'rgb(156,0,156)',
    'rgb(252,127,0)',
    'rgb(255,255,0)',
    'rgb(0,252,0)',
    'rgb(0,147,147)',
    'rgb(0,255,255)',
    'rgb(0,0,252)',
    'rgb(255,0,255)',
    'rgb(127,127,127)',
    'rgb(210,210,210)',
    'rgb(71,0,0)',
    'rgb(71,33,0)',
    'rgb(71,71,0)',
    'rgb(50,71,0)',
    'rgb(0,71,0)',
    'rgb(0,71,44)',
    'rgb(0,71,71)',
    'rgb(0,39,71)',
    'rgb(0,0,71)',
    'rgb(46,0,71)',
    'rgb(71,0,71)',
    'rgb(71,0,42)',
    'rgb(116,0,0)',
    'rgb(116,58,0)',
    'rgb(116,116,0)',
    'rgb(81,116,0)',
    'rgb(0,116,0)',
    'rgb(0,116,73)',
    'rgb(0,116,116)',
    'rgb(0,64,116)',
    'rgb(0,0,116)',
    'rgb(75,0,116)',
    'rgb(116,0,116)',
    'rgb(116,0,69)',
    'rgb(181,0,0)',
    'rgb(181,99,0)',
    'rgb(181,181,0)',
    'rgb(125,181,0)',
    'rgb(0,181,0)',
    'rgb(0,181,113)',
    'rgb(0,181,181)',
    'rgb(0,99,181)',
    'rgb(0,0,181)',
    'rgb(117,0,181)',
    'rgb(181,0,181)',
    'rgb(181,0,107)',
    'rgb(255,0,0)',
    'rgb(255,140,0)',
    'rgb(255,255,0)',
    'rgb(178,255,0)',
    'rgb(0,255,0)',
    'rgb(0,255,160)',
    'rgb(0,255,255)',
    'rgb(0,140,255)',
    'rgb(0,0,255)',
    'rgb(165,0,255)',
    'rgb(255,0,255)',
    'rgb(255,0,152)',
    'rgb(255,89,89)',
    'rgb(255,180,89)',
    'rgb(255,255,113)',
    'rgb(207,255,96)',
    'rgb(111,255,111)',
    'rgb(101,255,201)',
    'rgb(109,255,255)',
    'rgb(89,180,255)',
    'rgb(89,89,255)',
    'rgb(196,89,255)',
    'rgb(255,102,255)',
    'rgb(255,89,188)',
    'rgb(255,156,156)',
    'rgb(255,211,156)',
    'rgb(255,255,156)',
    'rgb(226,255,156)',
    'rgb(156,255,156)',
    'rgb(156,255,219)',
    'rgb(156,255,255)',
    'rgb(156,211,255)',
    'rgb(156,156,255)',
    'rgb(220,156,255)',
    'rgb(255,156,255)',
    'rgb(255,148,211)',
    'rgb(0,0,0)',
    'rgb(19,19,19)',
    'rgb(40,40,40)',
    'rgb(54,54,54)',
    'rgb(77,77,77)',
    'rgb(101,101,101)',
    'rgb(129,129,129)',
    'rgb(159,159,159)',
    'rgb(188,188,188)',
    'rgb(226,226,226)',
    'rgb(255,255,255))'
  ];

      // White list of chars we want to accept, not at the moment
      // though, we just use this for random chars on new ascii
export const charCodes = [' ', '!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',', '-', '.', '/',
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?', '@', 'A',
        'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S',
        'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\\', ']', '^', '_', '`', 'a', 'b', 'c', 'd', 'e',
        'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w',
        'x', 'y', 'z', '{', '|', '}', '~', 'Ç', 'ü', 'é', 'â', 'ä', 'à', 'å', 'ç', 'ê', 'ë', 'è',
        'ï', 'î', 'ì', 'Ä', 'Å', 'É', 'æ', 'Æ', 'ô', 'ö', 'ò', 'û', 'ù', 'ÿ', 'Ö', 'Ü', 'ø', '£',
        'Ø', '×', 'ƒ', 'á', 'í', 'ó', 'ú', 'ñ', 'Ñ', 'ª', 'º', '¿', '®', '¬', '½', '¼', '¡', '«',
        '»', '░', '▒', '▓', '│', '┤', 'Á', 'Â', 'À', '©', '╣', '║', '╗', '╝', '¢', '¥', '┐', '└',
        '┴', '┬', '├', '─', '┼', 'ã', 'Ã', '╚', '╔', '╩', '╦', '╠', '═', '╬', '¤', 'ð', 'Ð', 'Ê',
        'Ë', 'È', 'ı', 'Í', 'Î', 'Ï', '┘', '┌', '█', '▄', '¦', 'Ì', '▀', 'Ó', 'ß', 'Ô', 'Ò', 'õ',
        'Õ', 'µ', 'þ', 'Þ', 'Ú', 'Û', 'Ù', 'ý', 'Ý', '¯', '´', '≡', '±', '‗', '¾', '¶', '§', '÷',
        '¸', '°', '¨', '·', '¹', '³', '²'
      ];


export const toolbarIcons = [{
        name: 'default',
        icon: 'mouse-pointer',
        fa: 'fas',
        svgPath: 'assets/mouse-pointer-solid.svg',
      },
      {
        name: 'select',
        icon: 'square',
        fa: 'far',
        svgPath: 'assets/square-regular.svg',
      },
      {
        name: 'text',
        icon: 'font',
        fa: 'fas',
        svgPath: 'assets/font-solid.svg',
      },
      {
        name: 'fill',
        icon: 'fill-drip',
        fa: 'fas',
        svgPath: 'assets/fill-drip-solid.svg',
      },
      {
        name: 'brush',
        icon: 'paint-brush',
        fa: 'fas',
        svgPath: 'assets/paint-brush-solid.svg',
      },
      {
        name: 'dropper',
        icon: 'eye-dropper',
        fa: 'fas',
        svgPath: 'assets/eye-dropper-solid.svg',
      },
      {
        name: 'eraser',
        icon: 'eraser',
        fa: 'fas',
        svgPath: 'assets/eraser-solid.svg',
      },
    ];

  export default createNewAscii