// GLOBAL VARS for synchronizing computation
var orderSet = new Set();
var orderIterator;
var currentTabID;
var currentOrderURL;
var currentOrderURLLoaded;
document.getElementById("idTable").style.display = "none";

// Listen for a file being selected through the file picker
const inputElement = document.getElementById("input");
inputElement.addEventListener("change", handleFilePicked, false);

function handleFilePicked() {
  loadPDFParseDisplayResults(this.files);
}


function handleUpdated(tabId, changeInfo, tabInfo) {
  if (!changeInfo) return;
  if ((changeInfo.url !== undefined) && (changeInfo.url == currentOrderURL)) {
    currentTabID = tabId;
    console.log("tab id is " + currentTabID);
  }
  if ((changeInfo.status != undefined) && (changeInfo.status == "complete") && (tabId == currentTabID)) {
    currentOrderURLLoaded = true;
    console.log("tab is done loading");
    iterateScan();
  }
}

function setupScan() {
  scanElement.disabled = true;
  inputElement.disabled = true;
  orderIterator = orderSet[Symbol.iterator]();
  browser.tabs.onUpdated.addListener(handleUpdated);
}

function teardownScan() {
    browser.tabs.onUpdated.removeListener(handleUpdated);
    scanElement.disabled = false;
    inputElement.disabled = false;
    orderIterator = null;
}

function iterateScan() {
  currentOrderURL = orderIterator.next().value;
  if (!currentOrderURL) {
    teardownScan();
    return;
  }
  browser.tabs.update({url: currentOrderURL}); 
}

function handleScanRequest() {
  setupScan();
  iterateScan();
  // orderSet.forEach(function(value) {
  //   browser.tabs.update({url: value});
  //   loadOrder(value).then(result => console.log(loadingDone))
  // });

}


// PROMISES
// function loadOrder(url) {
//   currrentOrderURL = url;
//   currentOrderURLLoaded = false;
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       if (currentOrderURLLoaded)
//         resolve();  
//     }, 500);
//   });
// }

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
  tabBody=document.getElementById("idTable");
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
  tabBody=document.getElementById("idTable");
  tabBody.innerHTML = "<h1>ORDERS</h1><table id='mytable'><tbody></tbody></table>"
}

function loadPDFParseDisplayResults(fileList) {
  if (fileList[0]) clearOrderTable();
  document.getElementById("idTable").style.display = "block";
  const imageURL = window.URL.createObjectURL(fileList[0]);
  parseAmazonOrderIDsFromPDF(imageURL).then(function (text) {
    var textEls = text.split(" ");
    for (i = 0; i < textEls.length; i++) {
      if (/\d{3}-\d{7}-\d{7}/.test(textEls[i]))
        addRowToOrderTable(textEls[i].substring(0,19), "link")
    }
  },
  function (reason) {
    console.error(reason);
  });
}