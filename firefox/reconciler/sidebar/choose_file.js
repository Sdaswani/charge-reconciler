/*
Listens for a file being selected, creates a ObjectURL for the chosen file, injects a
content script into the active tab then passes the image URL through a message to the
active tab ID.
*/

// Listen for a file being selected through the file picker
const inputElement = document.getElementById("input");
inputElement.addEventListener("change", handlePicked, false);

// Get the image file if it was chosen from the pick list
function handlePicked() {
  displayFile(this.files);
}

function gettext(pdfUrl){
  var PDFJS = window['pdfjs-dist/build/pdf'];

  // The workerSrc property shall be specified.
  PDFJS.GlobalWorkerOptions.workerSrc = 'pdf.worker.js';
  var pdfDoc = PDFJS.getDocument(pdfUrl);
  return pdfDoc.promise.then(function(pdf) { // get all pages text
    var maxPages = pdf._pdfInfo.numPages;
    var countPromises = []; // collecting all page promises
    for (var j = 1; j <= maxPages; j++) {
      var page = pdf.getPage(j);

      var txt = "";
      countPromises.push(page.then(function(page) { // add page promise
        var textContent = page.getTextContent();
        return textContent.then(function(text){ // return content promise
          return text.items.map(function (s) { return s.str; }).join(''); // value page text
        });
      }));
    }
    // Wait for all pages and join text
    return Promise.all(countPromises).then(function (texts) {
      return texts.join('');
    });
  });
}

/* 
Insert the content script and send the image file ObjectURL to the content script using a 
message.
*/ 
function displayFile(fileList) {
  const imageURL = window.URL.createObjectURL(fileList[0]);
  // waiting on gettext to finish completion, or error
  gettext(imageURL).then(function (text) {
    var textEls = text.split(" ");
    for (i = 0; i < textEls.length; i++) {
      if (/\d{3}-\d{7}-\d{7}/.test(textEls[i]))
        console.log(textEls[i].substring(0,19));
    }
  },
  function (reason) {
    console.error(reason);
  });
}


// Ignore the drag enter event - not used in this extension
function dragenter(e) {
  e.stopPropagation();
  e.preventDefault();
}

// Ignore the drag over event - not used in this extension
function dragover(e) {
  e.stopPropagation();
  e.preventDefault();
}