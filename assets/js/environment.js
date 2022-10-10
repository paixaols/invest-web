const apiURL = 'https://labs-api-investe.herokuapp.com'

// TODO: construir um currencyFormat pra qq moeda
let currencyFormat = new Intl.NumberFormat('pt', {style: 'currency', currency: 'BRL'})
let percentFormat = new Intl.NumberFormat('pt', {style: 'percent', minimumFractionDigits: 1})
let dateFormat = new Intl.DateTimeFormat('pt', {year: 'numeric', month: 'short', day: '2-digit'})

// ------------------------------------------------------------------------- //
// API requests
// ------------------------------------------------------------------------- //
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
