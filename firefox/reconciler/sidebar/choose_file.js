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

/* 
Insert the content script and send the image file ObjectURL to the content script using a 
message.
*/ 
function displayFile(fileList) {
  const imageURL = window.URL.createObjectURL(fileList[0]);
  // Loaded via <script> tag, create shortcut to access PDF.js exports.
  var pdfjsLib = window['pdfjs-dist/build/pdf'];

  // The workerSrc property shall be specified.
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.js';

  var loadingTask = pdfjsLib.getDocument(imageURL);
  loadingTask.promise.then(function(pdf) {
   console.log("pdf loaded")
  }, function (reason) {
    // PDF loading error
    console.error(reason);
  });
  alert("i aim to misbehave")
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