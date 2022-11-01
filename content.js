const _thisUrl = document.URL;
const _thisTitle = document.title;

if (new RegExp('^https?://.+$').test(_thisUrl)) {
    const _cleanUrl = utils.cleanUrl(_thisUrl);
    let [mainCompany,] = utils.searchStrings([_thisTitle, _cleanUrl], companiesNames, true)
    chrome.runtime.sendMessage(mainCompany.length === 0 ? "" : `${mainCompany.length}+`);
}

