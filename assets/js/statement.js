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

function fillTable(response){
    let table = document.getElementById('statement-table-body')
    for(i in response){
        var entry = response[i]
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

let dateFormat = new Intl.DateTimeFormat('pt', {year: 'numeric', month: 'short', day: '2-digit'})
let currencyFormat = new Intl.NumberFormat('pt', {style: 'currency', currency: 'BRL'})

function onLoad() {
    makeRequest('GET', apiURL+'/get-full-statement', undefined, fillTable)
}
document.addEventListener('load', onLoad())
