const triggerDownloads = downloads => {
  // alert("Contentscript is sending a message to background script: '" + contentScriptMessage  + "'");
  chrome.extension.sendMessage({
    message: downloads
  });
};

const addCheckBoxes = links => {
  for (let href_number = 0; href_number < links.length; href_number++) {
    let box = document.createElement("input");

    let att = document.createAttribute("type");
    att.value = "checkbox";
    box.setAttributeNode(att);

    let att1 = document.createAttribute("name");
    att1.value = "downloadSelect";
    box.setAttributeNode(att1);

    let att2 = document.createAttribute("value");
    att2.value = links[href_number].href;
    box.setAttributeNode(att2);

    let att3 = document.createAttribute("class");
    att3.value = "sexy-input";
    box.setAttributeNode(att3);

    let att4 = document.createAttribute("data-filename");
    att4.value = links[href_number];
    box.setAttributeNode(att4);

    links[href_number].parentNode.insertBefore(box, links[href_number]);
  }
};

const addButton = (referenceButton, buttonValue) => {
  let button = document.createElement("input");

  let att1 = document.createAttribute("type");
  att1.value = "button";
  button.setAttributeNode(att1);

  let att2 = document.createAttribute("class");
  att2.value = "btn btn-primary";
  button.setAttributeNode(att2);

  let att3 = document.createAttribute("name");
  att3.value = buttonValue;
  button.setAttributeNode(att3);

  let att4 = document.createAttribute("value");
  att4.value = buttonValue;
  button.setAttributeNode(att4);

  let att5 = document.createAttribute("style");
  att5.value = "padding:3px 16px;font-size:13px;background-color:black;";
  button.setAttributeNode(att5);

  referenceButton.parentNode.insertBefore(button, referenceButton.nextSibling);
};

const selectAllLinks = () => {
  let links = [...document.getElementsByClassName("sexy-input")];
  links.forEach(link => {
    link["checked"] = document.getElementById("selectAll")["checked"];
  });
};

const getLinkInfo = (linkElement, index) => {
  // observational, reference table above has below property
  if (linkElement.parentElement.outerText.indexOf("_") === -1) {
    const description =
      linkElement.parentElement.parentElement.previousElementSibling.innerText;
    const date =
      linkElement.parentElement.parentElement.previousElementSibling
        .previousElementSibling.previousElementSibling.innerText;
    let title = (index + 1).toString() + "-" + description + "-" + date;
    title = title.replace(/[/:*?"<>|]/g, "_");
    return { url: linkElement.value, title: title };
  }
  return {
    url: linkElement.value,
    title: ""
  };
};

const downloadFiles = type => {
  const detailsTable = document
    .getElementsByClassName("table")[0]
    .getElementsByTagName("td");

  const syllabusLink =
    document.getElementsByClassName("btn btn-primary")[0].innerText ===
    "Download"
      ? document.getElementsByClassName("btn btn-primary")[0].href
      : false;

  let allLinks = [...document.getElementsByClassName("sexy-input")];

  const course = detailsTable[7].innerText + "-" + detailsTable[8].innerText;
  let facultySlotName =
    detailsTable[12].innerText + "-" + detailsTable[11].innerText;
  facultySlotName = facultySlotName.replace(/[/]/g, "-");

  allLinks = allLinks
    .map((link, index) => {
      if (link["checked"] || type === "all") {
        return getLinkInfo(link, index);
      }
      return null;
    })
    .filter(value => value);

  if (syllabusLink && type === "all") {
    allLinks.push({ title: "Syllabus", url: syllabusLink });
  }

  return triggerDownloads({
    linkData: allLinks,
    course: course,
    facultySlotName: facultySlotName
  });
};

const modifyPage = () => {
  // add selectAll checkbox
  let selectAll = document.createElement("input");

  let att1 = document.createAttribute("type");
  att1.value = "checkbox";
  selectAll.setAttributeNode(att1);

  let att2 = document.createAttribute("id");
  att2.value = "selectAll";
  selectAll.setAttributeNode(att2);

  let selectAllText = document.createElement("p");
  selectAllText.innerHTML = "Select All";

  let div = document.getElementsByClassName("table-responsive")[0];
  div.appendChild(selectAllText);
  div.appendChild(selectAll);

  // add checkboxes
  let links = [...document.getElementsByClassName("btn btn-link")].filter(
    item => item.outerText.indexOf("Web Material") === -1
  );

  addCheckBoxes(links);

  // add new buttons
  let oldButtons = document.getElementsByClassName("btn btn-primary");
  let goBackButton = oldButtons[oldButtons.length - 2];
  let downloadAllButton = oldButtons[oldButtons.length - 1];

  addButton(downloadAllButton, "Download Selected Files");

  downloadAllButton.innerHTML = "Download All Files";
  downloadAllButton.style["backgroundColor"] = "black";
  downloadAllButton.removeAttribute("href");

  goBackButton.style["backgroundColor"] = "black";

  newButtons = document.getElementsByClassName("btn btn-primary");
  let downloadSelectButton = newButtons[newButtons.length - 1];

  downloadSelectButton.addEventListener(
    "click",
    () => downloadFiles("selected"),
    false
  );
  downloadAllButton.addEventListener(
    "click",
    () => downloadFiles("all"),
    false
  );
  selectAll.addEventListener("click", selectAllLinks, false);

  // add credits
  let credsLocation = document.getElementsByClassName(
    "col-sm-12 col-md-11 col-md-offset-0"
  )[0];
  let credsText = document.createElement("p");
  credsText.innerHTML =
    '<center>CoursePage Download Manager- Made with ♥, <a href="https://www.github.com/Presto412" target="_blank">Priyansh Jain</a></center>';
  credsLocation.appendChild(credsText);

  jQuery.unblockUI();
};

chrome.runtime.onMessage.addListener(request => {
  // alert("Contentscript has received a message from from background script: '" + request.message + "'");
  if (request.message === "ClearCookie?") {
    try {
      if (
        document.getElementsByTagName("h1")[0].innerHTML === " Not Authorized "
      ) {
        chrome.extension.sendMessage({
          message: "YesClearCookiePls"
        });
      }
    } catch (error) {}
  } else if (request.message === "ReloadFacultyPage") {
    try {
      chrome.storage.local.get(["facultyHTML"], function(result) {
        if (!result) {
          throw new Error("Invalid");
        }
        jQuery("#page-wrapper").html(result.facultyHTML);
        jQuery.unblockUI();
      });
    } catch (error) {
      console.log("faced error", error);
    }
  } else if (request.message === "StoreFacultyPage") {
    try {
      let html = jQuery("#page-wrapper .container")[0].outerHTML;
      chrome.storage.local.set({ facultyHTML: html });
    } catch (error) {
      console.log("faced error", error);
    }
  } else if (request.message === "ShowLoading") {
    jQuery.blockUI({
      message: "<h1> Wait for it...</h1>"
    });
  } else {
    try {
      modifyPage();
    } catch (error) {
      console.log(error);
    }
  }
});
