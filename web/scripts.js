// GLOBAL VARS for synchronizing computation
var orderSet = new Set();
var orderIterator;
var currentTabID;
var currentOrderURL;
var currentOrderURLLoaded;
document.getElementById("orderTable").style.display = "none";

// Listen for a file being selected through the file picker
const inputElement = document.getElementById("fileSelection");
inputElement.addEventListener("change", handleFileSelection, false);

function handleFileSelection() {
  loadPDFParseDisplayResults(this.files);
}

function parseAmazonOrderIDsFromPDF(pdfUrl){
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

function addRowToOrderTable(content,morecontent) {
  if (!document.getElementById) return;
  tabBody=document.getElementById("orderTable");
  row=document.createElement("tr");
  cell1 = document.createElement("td");
  var a = document.createElement('a');  
  var link = document.createTextNode(content);   
  a.appendChild(link);
  var orderUrl = "https://www.amazon.com/gp/your-account/order-history/ref=ppx_yo_dt_b_search?opt=ab&search=".concat(content);
  a.href = orderUrl;
  a.target="_blank"; 
  orderSet.add(orderUrl);
  cell1.appendChild(a);
  row.appendChild(cell1);
  tabBody.appendChild(row);
}

function clearOrderTable() {
  orderSet.clear();
  if (!document.getElementById) return;
  tabBody=document.getElementById("orderTable");
  tabBody.innerHTML = "<center><h1 id='ordersHeader'>Amazon<br>Orders</h1></center><table id='table'><tbody></tbody></table>"
}

function loadPDFParseDisplayResults(fileList) {
  if (fileList[0]) clearOrderTable();
  var rowsAdded = 0;
  document.getElementById("orderTable").style.display = "block";
  const imageURL = window.URL.createObjectURL(fileList[0]);
  parseAmazonOrderIDsFromPDF(imageURL).then(function (text) {
    var textEls = text.split(" ");
    for (i = 0; i < textEls.length; i++) {
      if (/\d{3}-\d{7}-\d{7}/.test(textEls[i])) { // Amazon Order IDs are numeric xxx-xxxxxxx-xxxxxxx
        addRowToOrderTable(textEls[i].substring(0,19), "link")
        rowsAdded++;
      }
    }
    if (rowsAdded < 1)
        document.getElementById("ordersHeader").innerHTML = "No Amazon orders found. Check <a href=faq.html target='_blank'>FAQ</a> for supported credit card statements.";
  },
  function (reason) {
    console.error(reason);
  });
}