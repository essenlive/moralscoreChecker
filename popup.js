const manifest = chrome.runtime.getManifest();
const utils = {};

const BLACKLISTED_PARAMS = ['utm_', 'clid'];


utils.getId = function(id){
    return document.getElementById(id);
}

utils.stringToDom = function(string){
    return document.createRange().createContextualFragment(string.trim());
}

function createLinks() {

  document.querySelectorAll('[data-link]').forEach(
    _link => {
      _link.classList.add("pointer");
      _link.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({
          url: _link.getAttribute('data-link')
        });
      })
    });
}
function cleanUpParameters(url) {
  const urlObj = new URL(url);
  const params = urlObj.searchParams;
  const blacklistedKeys = []

  for (const key of params.keys()) {
    if (BLACKLISTED_PARAMS.some((entry) => key.includes(entry))) {
      // Can't delete directly since it will mess up the iterator order
      // Saving it temporarily to delete later
      blacklistedKeys.push(key)
    }
  }

  for (const key of blacklistedKeys) {
    params.delete(key)
  }

  // Reconstruct search params after cleaning up
  urlObj.search = params.toString()

  return urlObj.toString()
}

function cleanUrl(url) {
  // (maybe) clean up analytics-related params
  url = (url.includes('?')) ? cleanUpParameters(url) : url;
  // strip protocol for better results
  url = url.replace(/(^\w+:|^)\/\//, '');
  // also, strip anchors
  url = url.replace(/(#.+?)$/, '');
  // also, strip index.php/html
  url = url.replace(/index\.(php|html?)/, '');
  // also, strip single leading slash, e.g. example.com/ -> example.com
  url = (url.endsWith("/") && url.split("/").length < 3) ? url.replace(/\/+$/, '') : url;
  return url;
}

function normalizeString(string) {
  return string.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]/g, " ").toLowerCase()
}

// async function getAllCompanies() {
//   let offset = "", data = []
//   while (true) {
//     let res = await fetch(`https://api.airtable.com/v0/appPMCGtmiMHC3pYi/moralscore?${offset}`, { headers: { 'Authorization': 'Bearer XXXXXXXXXXXXXX' }});
//     res = await res.json();
//     if (res.error) return res

//     data = [...data, res.records].flat()

//     if( !res.offset ) break;  
//     offset = `offset=${res.offset}`;
//   }

//   return data.map(el=>el.fields);
// }


function searchStrings(content, strings, strict = false) {
  let instances = [], leftovers = [], spacer = strict ? " " : "";
  content = normalizeString([spacer, ...content, spacer].join(spacer));
  // if (strict)content = content.replace(/[^A-Za-z0-9]/g, spacer);
  strings.forEach((string) => {
    if (content.search(`${spacer}${normalizeString(string)}${spacer}`) >= 0) { instances.push(string) }
    else { leftovers.push(string) }
  })
  return [instances, leftovers]
}

function getBetterAlternatives(company, maxOutput = 3){
  const betterAlternatives = companies.filter(comp => (comp.score > company.score && comp.secteur === company.secteur))
  const sortedAlternatives = betterAlternatives.sort((a, b) => (b.score - a.score));
  const limitedAlternatives = sortedAlternatives.splice(0, maxOutput)
  return limitedAlternatives
}

function getColorGrade(grade){
  if ( typeof grade === "number") {
    if (grade < 35) return "black"
    if (grade < 50) return "maroon"
    if (grade < 60) return "red"
    if (grade < 70) return "olive"
    return "green"
  }
  else{
    if (grade.indexOf("A") >= 0) return "green"
    if (grade.indexOf("B") >= 0) return "olive"
    if (grade.indexOf("C") >= 0) return "maroon"
    if (grade.indexOf("D") >= 0) return "black"
  }
}

utils.getId('version-label').textContent = "Ver. " + manifest.version;
utils.getId('about-link').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({
    url: manifest.homepage_url
  });
});

const $content = utils.getId('content');


chrome.tabs.query({active:true,currentWindow:true}, async (tabs) => {
  
  const _thisTab = tabs[0]
  const _thisUrl = _thisTab.url;
  const _thisTitle = _thisTab.title;

  window.addEventListener("unload", function () {
    chrome.browserAction.setBadgeText({ text: "", tabId: _thisTab.id });
  });
  
  if (new RegExp('^https?://.+$').test(_thisUrl)) {

    const _cleanUrl = cleanUrl(_thisUrl);
    // console.log(await getAllCompanies());

    chrome.tabs.executeScript(_thisTab.id, { code: 'document.querySelector("body").innerText' }, content=>{

      let companiesName = companies.map(el => el.name);
      let [mainCompany, leftovers] = searchStrings([_thisTitle, _cleanUrl], companiesName, true)
      mainCompany = companies.filter((el) => (mainCompany.indexOf(el.name) >= 0))
      let [namedCompanies,] = searchStrings(content, leftovers, true)
      namedCompanies = companies.filter((el) => (namedCompanies.indexOf(el.name) >= 0))

      chrome.browserAction.setBadgeBackgroundColor({ color: '#000' }, () => {
        chrome.browserAction.setBadgeText({ text: [...mainCompany, ...namedCompanies].length === 0 ? "" : [...mainCompany, ...namedCompanies].length.toString(), tabId: _thisTab.id });
      });

      render([...mainCompany, ...namedCompanies].flat())

    });
  } else {
    render(false);
  }
 
});



function render(data) {
  while ($content.firstChild) {
   $content.removeChild($content.lastChild);
  }

  if (data instanceof Error) {
    $content.appendChild( utils.stringToDom(`<li class="p2 my1"><p class="mb1">Sorry, something went wrong :</p><pre class="m0">${data.message}</pre></li>`) );
    return;
  }

  if (!data || data.length === 0) {
    $content.appendChild(utils.stringToDom(`<li class="p2" style="max-width:500px"><p class="mb1">Désolé, nous n'avons trouvé aucune marque présente sur MoralScore... mais c'est peut-être une erreur. Allez verifier directement sur Moralscore.</p><p class="m0"><button class="btn btn-small btn-primary h6 uppercase" data-link="https://moralscore.org/search/">Chercher sur Moralscore</button></p></li>`));
  } 
  else {

    let _node = '';
    data.forEach((el) => {
      let _alt = '';
      const alt = getBetterAlternatives(el, 3)

      if (alt.length > 0) {
        _alt += `<ul class="py1 px2 flex items-center  list-reset mb0 border-bottom border-gray-2 ">
          <li class="gray-4 pr1" >Alternatives → </li>`
        alt.forEach((com, i) => {
          _alt += `<li title="Voir le moralscore de ${com.name}" class="flex pr1 items-center hover-t-gray gray-4" data-link="${com.url}"> <img style="width:16px;height:16px;" class="mr1 rounded " alt="${com.name} (logo)" src="${com.image[0].thumbnails.small.url}"><span>${com.name}</span> <span class="${getColorGrade(com.score)} mx1">${com.score}</span> ${i < alt.length - 1 ? '•' : ''}
          </li>`
        })
        _alt += `</ul>`
      }

      _node += `
        <li style="border-width:3px" class="border-left border-${getColorGrade(el.score)} hover-gray flex flex-column">
          <div title="Voir le moralscore de ${el.name}" class="py1 px2 border-bottom border-gray-2 flex items-center" data-link="${el.url}">
            <img style="width:36px;height:36px;" class="mr2 rounded col-1" alt="${el.name} (logo)" src="${el.image[0].thumbnails.small.url}">
            <div class="col-11">
              <span class="block mb1 h6"><strong>${el.name}</strong> <span style="padding-bottom: 0.25rem" class="border-${getColorGrade(el.score)} border ml1 tabbed px1">${el.score} / 100</span></span>
              <div class="block h6 gray-4 relative"> 
                <span><abbr title="${el.environmentDetail}"> Environnement : <strong class="${getColorGrade(el.environmentScore)}"> ${el.environmentScore}</abbr></strong> • </span>               
                <span><abbr title="${el.fiscalDetail}"> Fiscal : <strong class="${getColorGrade(el.fiscalScore)}"> ${el.fiscalScore}</abbr></strong> • </span>               
                <span><abbr title="${el.governanceDetail}"> Gouvernance : <strong class="${getColorGrade(el.governanceScore)}"> ${el.governanceScore}</abbr></strong> • </span>               
                <span><abbr title="${el.innovationDetail}"> Innovation : <strong class="${getColorGrade(el.innovationScore)}"> ${el.innovationScore}</abbr></strong> • </span>               
                <span><abbr title="${el.workDetail}"> Travail : <strong class="${getColorGrade(el.workScore)}"> ${el.workScore}</abbr></strong> • </span>               
                <span><abbr title="${el.dronificationDetail}"> Dronification : <strong class="${getColorGrade(el.dronificationScore)}"> ${el.dronificationScore}</abbr></strong> • </span>               
                <span><abbr title="${el.equalityDetail}"> Égalité : <strong class="${getColorGrade(el.equalityScore)}"> ${el.equalityScore}</abbr></strong> • </span>              
                <span><abbr title="${el.dataDetail}"> Données privées : <strong class="${getColorGrade(el.dataScore)}"> ${el.dataScore}</abbr></strong> • </span>               
                <span><abbr title="${el.productDetail}"> Produit : <strong class="${getColorGrade(el.productScore)}"> ${el.productScore}</abbr></strong> • </span>               
                <span><abbr title="${el.priceDetail}"> Prix : <strong class="${getColorGrade(el.priceScore)}"> ${el.priceScore}</abbr></strong></span>
              </div>
            </div>
          </div>
          ${_alt}

        </li>`;

    })
    _node = utils.stringToDom(_node);
    $content.appendChild(_node);

  }

  createLinks()

}