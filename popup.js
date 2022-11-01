const manifest = chrome.runtime.getManifest();

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

    const _cleanUrl = utils.cleanUrl(_thisUrl);
    // console.log(await getAllCompanies());

    chrome.tabs.executeScript(_thisTab.id, { code: 'document.querySelector("body").innerText' }, content=>{

      let companiesName = companies.map(el => el.name);
      let [mainCompany, leftovers] = utils.searchStrings([_thisTitle, _cleanUrl], companiesName, true)
      mainCompany = companies.filter((el) => (mainCompany.indexOf(el.name) >= 0))
      let [namedCompanies,] = utils.searchStrings(content, leftovers, true)
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
    // To implement filters
    let _node = data.length < 3000 ? "" : `<div class="gray-4 block relative py1 px2 border-bottom border-gray-3 bg-gray-1 flex items-center background-gray-2" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(20%, 1fr));"><span>Environnement</span><span>Fiscal</span><span>Gouvernance</span><span>Innovation</span><span>Travail</span><span>Dronification</span><span>Égalité</span><span>Données privées</span><span>Produit</span><span>Prix</span></div>`;
    data.forEach((el) => {
      let _alt = '';
      const alt = utils.getBetterAlternatives(el, companies, 3)

      if (alt.length > 0) {
        _alt += `<ul class="py1 px2 flex items-center  list-reset mb0 border-bottom border-gray-2 ">
          <li class="gray-4 pr1" >Alternatives → </li>`
        alt.forEach((com, i) => {
          _alt += `<li class="flex pr1 items-center gray-4">
            <img data-link="${com.url}" style="width:16px;height:16px;" class="mr1 rounded hover-opacity" alt="${com.name} (logo)" src="${com.image[0].thumbnails.small.url}">
            <strong class="${utils.getColorGrade(com.score)} mr1">${com.score}</strong>
            <span class="hover-t-gray mr1" title="Voir le moralscore de ${com.name}" data-link="${com.url}">${com.name}</span>
            <span class="hover-t-gray mr1" title="Voir le site de ${com.name}" data-link="${com.site}">🡥</span>
            ${i < alt.length - 1 ? '•' : ''}
          </li>`
        })
        _alt += `</ul>`
      }

      _node += `
        <li style="border-width:3px" class="border-left border-${utils.getColorGrade(el.score)} hover-gray flex flex-column">
          <div title="Voir le moralscore de ${el.name}" class="py1 px2 border-bottom border-gray-2 flex items-center">
            <img data-link="${el.url}" style="width:36px;height:36px;" class="hover-opacity mr2 rounded col-1" alt="${el.name} (logo)" src="${el.image[0].thumbnails.small.url}">
            <div class="col-11">
              <div class="block mb1 h6">
              <strong class="mr1 hover-opacity"  data-link="${el.url}">${el.name}</strong>
              <span class="hover-t-gray mr1" title="Voir le site de ${el.name}" data-link="${el.site}">🡥</span> • 
              <span class="ml1 gray-4" >${el.secteur}</span>
                <span style="padding-bottom: 0.25rem" class="border-${utils.getColorGrade(el.score)} border ml1 tabbed px1">${el.score} / 100</span>
              </div>
              <div class="block h6 gray-4 relative"> 
                <span><abbr title="${el.environmentDetail}"> Environnement : <strong class="${utils.getColorGrade(el.environmentScore)}"> ${el.environmentScore}</abbr></strong> • </span>               
                <span><abbr title="${el.fiscalDetail}"> Fiscal : <strong class="${utils.getColorGrade(el.fiscalScore)}"> ${el.fiscalScore}</abbr></strong> • </span>               
                <span><abbr title="${el.governanceDetail}"> Gouvernance : <strong class="${utils.getColorGrade(el.governanceScore)}"> ${el.governanceScore}</abbr></strong> • </span>               
                <span><abbr title="${el.innovationDetail}"> Innovation : <strong class="${utils.getColorGrade(el.innovationScore)}"> ${el.innovationScore}</abbr></strong> • </span>               
                <span><abbr title="${el.workDetail}"> Travail : <strong class="${utils.getColorGrade(el.workScore)}"> ${el.workScore}</abbr></strong> • </span>               
                <span><abbr title="${el.dronificationDetail}"> Dronification : <strong class="${utils.getColorGrade(el.dronificationScore)}"> ${el.dronificationScore}</abbr></strong> • </span>               
                <span><abbr title="${el.equalityDetail}"> Égalité : <strong class="${utils.getColorGrade(el.equalityScore)}"> ${el.equalityScore}</abbr></strong> • </span>              
                <span><abbr title="${el.dataDetail}"> Données privées : <strong class="${utils.getColorGrade(el.dataScore)}"> ${el.dataScore}</abbr></strong> • </span>               
                <span><abbr title="${el.productDetail}"> Produit : <strong class="${utils.getColorGrade(el.productScore)}"> ${el.productScore}</abbr></strong> • </span>               
                <span><abbr title="${el.priceDetail}"> Prix : <strong class="${utils.getColorGrade(el.priceScore)}"> ${el.priceScore}</abbr></strong></span>
              </div>
            </div>
          </div>
          ${_alt}

        </li>`;

    })
    _node = utils.stringToDom(_node);
    $content.appendChild(_node);

  }

  utils.createLinks()

}