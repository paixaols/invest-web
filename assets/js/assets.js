document.getElementById('btn-apply-filters').onclick = function(){
    var select = document.getElementById('select-menu1')
    var marketFilter = select.options[select.selectedIndex].value
    var select = document.getElementById('select-menu2')
    var classFilter = select.options[select.selectedIndex].value
    var select = document.getElementById('select-menu3')
    var typeFilter = select.options[select.selectedIndex].value
    var filteredAssets = []
    if(marketFilter === '0' & classFilter === '0' & typeFilter === '0'){
        fillTable(assetList)
    }else{
        for(i in assetList){
            var asset = assetList[i]
            if(marketFilter != '0' & asset.market != marketFilter){
                continue
            }
            if(classFilter != '0' & asset.class != classFilter){
                continue
            }            
            if(typeFilter != '0' & asset.type != typeFilter){
                continue
            }
            filteredAssets.push(asset)
        }
        fillTable(filteredAssets)
    }
}

function fillTable(assets){
    let table = document.getElementById('asset-table-body')
    table.innerText = ''
    for(i in assets){
        var asset = assets[i]
        var html = `<tr><td>${Number(i)+1}</td>`
        html += `<td>${asset.asset_name}</td>`
        html += `<td>${asset.description}</td>`
        html += `<td>${asset.market}</td>`
        html += `<td>${asset.class}</td>`
        html += `<td>${asset.type}</td>`
        if(asset.expire == '2200-12-31T00:00:00.000Z'){
            html += `<td>-</td>`
        }else{
            html += `<td>${dateFormat.format(new Date(asset.expire))}</td>`
        }
        table.insertAdjacentHTML('beforeend', html)
    }
}

let assetList = undefined

function callback(response){
    assetList = response
    let marketList = []
    let classList = []
    let typeList = []
    for(i in assetList){
        var asset = assetList[i]
        if(!marketList.includes(asset.market)){
            marketList.push(asset.market)
        }
        if(!classList.includes(asset.class)){
            classList.push(asset.class)
        }
        if(!typeList.includes(asset.type)){
            typeList.push(asset.type)
        }
    }
    marketList.sort()
    var html = ''
    for(i in marketList){
        html += `<option value="${marketList[i]}">${marketList[i]}</option>`
    }
    document.getElementById('select-menu1').insertAdjacentHTML('beforeend', html)

    classList.sort()
    var html = ''
    for(i in classList){
        html += `<option value="${classList[i]}">${classList[i]}</option>`
    }
    document.getElementById('select-menu2').insertAdjacentHTML('beforeend', html)

    typeList.sort()
    var html = ''
    for(i in typeList){
        html += `<option value="${typeList[i]}">${typeList[i]}</option>`
    }
    document.getElementById('select-menu3').insertAdjacentHTML('beforeend', html)

    fillTable(assetList)
}

function onLoad() {
    makeRequest('GET', apiURL+'/get-assets', undefined, callback)
}
document.addEventListener('load', onLoad())
