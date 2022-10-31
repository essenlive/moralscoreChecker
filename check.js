const BLACKLISTED_PARAMS = ['utm_', 'clid'];

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


const _thisUrl = document.URL;
const _thisTitle = document.title;
console.log(_thisUrl, _thisTitle);
const companiesName = [
  "Helios",
  "Veja",
  "Enercoop",
  "Jeujura",
  "Biocoop",
  "Bioburger",
  "ilek",
  "MAIF",
  "Le Slip Français",
  "Weleda",
  "Vrai",
  "Ma French Bank",
  "Camif",
  "Olly",
  "Bleu de Chauffe",
  "Bioviva",
  "Jimmy Fairly",
  "Fleurivore",
  "Coslys",
  "Hopaal",
  "Acorelle",
  "Kapla",
  "La Vie Claire",
  "Malo",
  "Fairphone",
  "Naturalia",
  "Sojasun",
  "Back Market",
  "Coslys",
  "Emmaüs",
  "Avril",
  "Patagonia",
  "1083",
  "Quechua",
  "Patagonia",
  "Decathlon",
  "Crédit Coopératif",
  "Noyoco",
  "Fleurs d'ici",
  "Smoby",
  "Vilac",
  "Dr Hauschka",
  "Vilebrequin",
  "La Poste Mobile",
  "Balzac Paris",
  "Janod",
  "Sézane",
  "Sandqvist",
  "Atalaye",
  "Sensee",
  "Allianz",
  "Big Fernand",
  "La Banque Postale",
  "Taxis G7",
  "Avril",
  "Stella McCartney",
  "Picture Organic Clothing",
  "Luko",
  "Monese",
  "Levi's",
  "Bioderma",
  "Fjallraven",
  "Monop'",
  "Ysé",
  "Muji",
  "Avène",
  "NIVEA",
  "Leroy Merlin",
  "Bioderma",
  "Knowledge Cotton",
  "Carrefour City",
  "Typology",
  "Armedangels",
  "Intermarché Express",
  "A-Derma",
  "Underprotection",
  "Just Eat",
  "Undiz",
  "Darty",
  "Nuxe",
  "Frichti",
  "Cattier Paris",
  "Franprix",
  "GMF",
  "Made.com",
  "Gucci",
  "Le Petit Basque",
  "N26",
  "Lego",
  "New Balance",
  "Hermès",
  "Bergamotte",
  "Fnac",
  "E.Leclerc",
  "Agnès B",
  "Total Direct Energie",
  "ManoMano",
  "Bio c'Bon",
  "EasyJet",
  "Klorane",
  "Tesla",
  "Everlane",
  "Intersport",
  "Playmobil",
  "Matmut",
  "Yves Rocher",
  "Dior",
  "Brio",
  "Deliveroo",
  "BMW",
  "Gap",
  "Prada",
  "Air France",
  "Ucon Acrobatics",
  "Danone",
  "MAAF",
  "AXA",
  "Rakuten",
  "Five Guys",
  "Le Bio",
  "Taillefine",
  "Les 2 Vaches",
  "MMA",
  "PinqPonq",
  "Puma",
  "Toyota",
  "Burger King",
  "Dior",
  "A.P.C.",
  "Sosh",
  "U Express",
  "Apple",
  "Meccano",
  "Pampa",
  "Castorama",
  "Auchan Supermarché",
  "Hartford",
  "Macif",
  "Vueling",
  "Chicco",
  "Avène",
  "Krys",
  "L'Occitane",
  "Hermès",
  "Clarins",
  "Atol",
  "Samsung",
  "Free Mobile",
  "B&YOU",
  "Etam",
  "Velouté",
  "North Face",
  "Asos",
  "Thierry Mugler",
  "Lidl",
  "Seagale",
  "Engie",
  "Jockey",
  "LDLC",
  "Adidas",
  "Paco Rabanne",
  "C. M. Assurances",
  "Marc Jacobs",
  "Asus",
  "Peugeot",
  "Bouygues Telecom",
  "Hasbro",
  "Zalando",
  "Quiksilver",
  "EDF",
  "Marcel",
  "Bricomarché",
  "Mixa",
  "Maisons du Monde",
  "Majorette",
  "Gervais",
  "GAN",
  "Groupama",
  "Lacoste",
  "Transavia",
  "Eastpak",
  "Bricorama",
  "Mercedes",
  "La Redoute",
  "Mamie Nova",
  "Nike",
  "Diadermine",
  "Celine",
  "Louis Vuitton",
  "Revolut",
  "ING",
  "CIC",
  "Lancôme",
  "Orange",
  "Yves Saint-Laurent",
  "NRJ Mobile",
  "Jean-Paul Gaultier",
  "Orange Bank",
  "Activia",
  "Rains",
  "Biotherm",
  "Zadig & Voltaire",
  "Boursorama",
  "Sephora",
  "COS",
  "Alpro",
  "Foot Locker",
  "Sarenza",
  "McDonald's",
  "Camaïeu",
  "Bolt",
  "Uniqlo",
  "Mr Bricolage",
  "Aquarelle",
  "Herschel",
  "Fjord",
  "Crédit Mutuel Arkea",
  "Sony",
  "Carrefour Assurances",
  "Gervita",
  "Amazon",
  "The Kooples",
  "Chanel",
  "LG",
  "Optic 2000",
  "C&A",
  "Audi",
  "Écouter Voir",
  "La Roche Posay",
  "Fa",
  "Boulanger",
  "C.A Assurances",
  "Danio",
  "JD Sports",
  "Caisse d'Épargne",
  "Cdiscount",
  "Go Sport",
  "Xiaomi",
  "Google",
  "Renault",
  "Ryanair",
  "Zara",
  "Heetch",
  "Banana Moon",
  "Aubade",
  "Gifi",
  "Courir",
  "Petits Filous",
  "Sport 2000",
  "Disney",
  "Bforbank",
  "Princesse tam.tam",
  "Direct Assurance",
  "Interflora",
  "Dacia",
  "Guerlain",
  "Calin",
  "Conforama",
  "La Roche Posay",
  "Vichy",
  "Citroën",
  "Primark",
  "Garnier",
  "Aliexpress",
  "Chanel",
  "Générale d'Optique",
  "Barbie",
  "Brico Dépôt",
  "Panier de Yoplait",
  "Volkswagen",
  "Frulos",
  "Victoria's Secret",
  "Alain Afflelou",
  "Kiabi",
  "Rogé Cavaillès",
  "Petit Yoplait",
  "Nickel",
  "Nature Sucré",
  "Crédit Agricole",
  "Hello bank!",
  "Optical Center",
  "Polette",
  "Saint-Laurent",
  "GrandOptical",
  "Ikea",
  "Glovo",
  "Bepanthol",
  "Kapten",
  "Panier de Yoplait Bio",
  "Maison Lejaby",
  "Banque Populaire",
  "Weldom",
  "Uber",
  "Crédit Mutuel",
  "Société Générale",
  "H&M",
  "Perle de lait",
  "HSBC",
  "Habitat",
  "Oppo",
  "La Halle",
  "KFC",
  "Sanex",
  "Huawei / Honor",
  "S.G Assurances",
  "Uber Eats",
  "Nokia",
  "RED by SFR",
  "LCL",
  "SFR",
  "Timotei",
  "Axe",
  "BUT",
  "Monsavon",
  "Tahiti",
  "Palmolive",
  "Oysho",
  "Dove",
  "La Laitière",
  "BNP Paribas",
  "Fisher-Price",
  "Yaos",
  "Elle & Vire"
]
chrome.browserAction.setBadgeText({ text: "" });
if (new RegExp('^https?://.+$').test(_thisUrl)) {

  const _cleanUrl = cleanUrl(_thisUrl);

    let [mainCompany] = searchStrings([_thisTitle, _cleanUrl], companiesName, true)
    console.log(mainCompany);

    if (mainCompany.length > 0) {
      console.log("mainCompany");
      chrome.browserAction.setBadgeBackgroundColor({ color: '#000' }, () => {
        chrome.browserAction.setBadgeText({ text: "✓" });
      });
    }
    else{
      // chrome.browserAction.setBadgeText({ text: "" });
    }


};


