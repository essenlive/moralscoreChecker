const utils = {};

utils.getId = function (id) {
    return document.getElementById(id);
}

utils.stringToDom = function (string) {
    return document.createRange().createContextualFragment(string.trim());
}

utils.createLinks = function () {

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
utils.cleanUpParameters = function (url) {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    const BLACKLISTED_PARAMS = ['utm_', 'clid']
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

utils.cleanUrl = function (url) {
    // (maybe) clean up analytics-related params
    url = (url.includes('?')) ? utils.cleanUpParameters(url) : url;
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

utils.normalizeString = function (string) {
    return string.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]/g, " ").toLowerCase()
}


utils.searchStrings = function (content, strings, strict = false) {
    let instances = [], leftovers = [], spacer = strict ? " " : "";
    content = utils.normalizeString([spacer, ...content, spacer].join(spacer));
    // if (strict)content = content.replace(/[^A-Za-z0-9]/g, spacer);
    strings.forEach((string) => {
        if (content.search(`${spacer}${utils.normalizeString(string)}${spacer}`) >= 0) { instances.push(string) }
        else { leftovers.push(string) }
    })
    return [instances, leftovers]
}

utils.getBetterAlternatives = function (company, companies, maxOutput = 3) {
    const betterAlternatives = companies.filter(comp => (comp.score > company.score && comp.secteur === company.secteur))
    const sortedAlternatives = betterAlternatives.sort((a, b) => (b.score - a.score));
    const limitedAlternatives = sortedAlternatives.splice(0, maxOutput)
    return limitedAlternatives
}

utils.getColorGrade = function (grade) {
    if (typeof grade === "number") {
        if (grade < 35) return "black"
        if (grade < 50) return "maroon"
        if (grade < 60) return "red"
        if (grade < 70) return "olive"
        return "green"
    }
    else {
        if (grade.indexOf("A") >= 0) return "green"
        if (grade.indexOf("B") >= 0) return "olive"
        if (grade.indexOf("C") >= 0) return "maroon"
        if (grade.indexOf("D") >= 0) return "black"
    }
}