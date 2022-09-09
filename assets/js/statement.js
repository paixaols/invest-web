// const apiURL = 'https://labs-api-investe.herokuapp.com'
const apiURL = 'http://127.0.0.1:5000'

function makeRequest(method, url, data=undefined, callback=undefined) {
    let xhr = new XMLHttpRequest()
    if (!xhr) {
        alert('Cannot create an XMLHTTP instance')
        return false
    }
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                let response = JSON.parse(xhr.responseText)
                if (callback) callback(response)
            } else {
                alert('There was a problem with the request.')
            }
        }
    }
    if (method == 'GET') {
        xhr.open('GET', url)
        xhr.send()
    } else if (method == 'POST') {
        xhr.open('POST', url)
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
        xhr.send(JSON.stringify(data))
    }
}

document.getElementById('btn-apply-filters').onclick = function(){
    var select = document.getElementById('select-menu1')
    var institutionFilter = select.options[select.selectedIndex].value
    var select = document.getElementById('select-menu2')
    var eventFilter = select.options[select.selectedIndex].value
    var select = document.getElementById('select-menu3')
    var assetFilter = select.options[select.selectedIndex].value
    var filteredTransactions = []
    if(institutionFilter === '0' & eventFilter === '0' & assetFilter === '0'){
        fillTable(transactionsList)
    }else{
        for(i in transactionsList){
            var t = transactionsList[i]
            if(institutionFilter != '0' & t.bank != institutionFilter){
                continue
            }
            if(eventFilter != '0' & t.event != eventFilter){
                continue
            }            
            if(assetFilter != '0' & t.asset_name != assetFilter){
                continue
            }
            filteredTransactions.push(t)
        }
        fillTable(filteredTransactions)
    }
}

function fillTable(transactions){
    let table = document.getElementById('statement-table-body')
    table.innerText = ''
    for(i in transactions){
        var entry = transactions[i]
        var html = `<tr><td>${Number(i)+1}</td>`
        html += `<td>${dateFormat.format(new Date(entry.date))}</td>`
        html += `<td>${entry.bank}</td>`
        html += `<td>${entry.event}</td>`
        html += `<td>${entry.asset_name}</td>`
        if(entry.event == 'desdobramento' | entry.event == 'grupamento'){
            html += `<td>${entry.split_factor.pre}:${entry.split_factor.pos}</td>`
        }else{
            html += `<td>${new Intl.NumberFormat('pt').format(entry.quantity)}</td>`
        }
        html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: entry.currency}).format(entry.value)}</td>`
        html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: entry.currency}).format(entry.fee)}</td>`
        table.insertAdjacentHTML('beforeend', html)
    }
}

let transactionsList = undefined

function callback(response){
    transactionsList = response
    let institutionList = []
    let eventList = []
    let assetList = []
    for(i in transactionsList){
        var transaction = transactionsList[i]
        if(!institutionList.includes(transaction.bank)){
            institutionList.push(transaction.bank)
        }
        if(!eventList.includes(transaction.event)){
            eventList.push(transaction.event)
        }
        if(!assetList.includes(transaction.asset_name)){
            assetList.push(transaction.asset_name)
        }
    }
    institutionList.sort()
    var html = ''
    for(i in institutionList){
        html += `<option value="${institutionList[i]}">${institutionList[i]}</option>`
    }
    document.getElementById('select-menu1').insertAdjacentHTML('beforeend', html)

    eventList.sort()
    var html = ''
    for(i in eventList){
        html += `<option value="${eventList[i]}">${eventList[i]}</option>`
    }
    document.getElementById('select-menu2').insertAdjacentHTML('beforeend', html)

    assetList.sort()
    var html = ''
    for(i in assetList){
        html += `<option value="${assetList[i]}">${assetList[i]}</option>`
    }
    document.getElementById('select-menu3').insertAdjacentHTML('beforeend', html)

    fillTable(transactionsList)
}

let dateFormat = new Intl.DateTimeFormat('pt', {year: 'numeric', month: 'short', day: '2-digit'})
let currencyFormat = new Intl.NumberFormat('pt', {style: 'currency', currency: 'BRL'})

function onLoad() {
    makeRequest('GET', apiURL+'/get-full-statement', undefined, callback)
}
document.addEventListener('load', onLoad())
