"use strict";
var page = require('webpage').create(),
  system = require('system'),
  address, output, size, pageWidth, pageHeight;
var fs = require('fs');


if (system.args.length < 3 || system.args.length > 5) {
  console.log('Usage: rasterize.js URL filename [paperwidth*paperheight|paperformat] [zoom]');
  console.log('  paper (pdf output) examples: "5in*7.5in", "10cm*20cm", "A4", "Letter"');
  console.log('  image (png/jpg output) examples: "1920px" entire page, window width 1920px');
  console.log('                                   "800px*600px" window, clipped to 800x600');
  phantom.exit(1);
}
else {
  address = system.args[1];
  output = system.args[2];

  // page.viewportSize = { width: 600, height: 600 };

  if (system.args.length > 3 && system.args[2].substr(-4) === ".pdf") {
    size = system.args[3].split('*');
    page.paperSize = size.length === 2 ? { width: size[0], height: size[1], margin: '0px' }
      : { format: system.args[3], orientation: 'portrait', margin: "0cm" };
  }

  if (system.args.length > 4) {
    page.zoomFactor = system.args[4];
  }

  // This will fix some things that I'll talk about in a second
  page.settings.dpi = "300";


  // hack to get header and footerdata from html template
  // I acknowledge that there may be a better solution
  var stream = fs.open(address, { mode: 'rw', charset: 'utf-8' }); // read html file
  var fileData = "";
  while (!stream.atEnd()) {
    fileData += stream.readLine(); // copy html line by line
  }
  stream.close(); // close stream

  // split textarea hack for header into headerHTML var
  var headerHTML = fileData.split('<textarea data-pos="header">')[1].split('</textarea>')[0];
  // repeat that for the footer
  var footerHTML = fileData.split('<textarea data-pos="footer">')[1].split('</textarea>')[0];

  // reconfig page, margins are important
  // header and footer height are bugged, don't try to change the values
  page.paperSize = {
    format: 'A4',
    orientation: 'portrait',
    margin: {
      top: "0cm",
      bottom: "0cm",
      left: "0cm",
      right: "0cm"
    },
    footer: {
      height: "1.5cm",
      contents: phantom.callback(function (pageNum, numPages) {
        return '' +
          '<div style="margin: 0 1cm 1cm 2cm; font-size: 0.65em; z-index: 9999999999999999999;">' +
          '   <div style="color: #888; padding:20px 20px 0 10px; border-top: 1px solid #ccc;">' +
          '       <span>' + footerHTML + '</span> ' +
          '       <span style="float:right">' + pageNum + ' / ' + numPages + '</span>' +
          '   </div>' +
          '</div>';
      })
    },
    header: {
      height: "1mm",
      contents: phantom.callback(function (pageNum, numPages) {
        if (pageNum === 1) {
          return headerHTML;
        }
        return "<div style='height: 2cm; width: 100%; position: relative; top: 0; left: 0; margin-bottom: 2cm;  z-index: 9999999999999999999;'></div>";
      })
    }
  };

  page.open(address, function (status) {
    if (status !== 'success') {
      console.log('Unable to load the address!');
      phantom.exit(1);
    } else {
      window.setTimeout(function () {
        page.render(output);
        phantom.exit();
      }, 200);
    }
  });

}
