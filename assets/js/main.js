// ------------------------------------------------------------------------- //
// Helper functions
// ------------------------------------------------------------------------- //
function sortLabeledData(dataArray, labelArray){
    var arrayOfObj = labelArray.map(function(d, i) {
        return {
            label: d,
            data: dataArray[i] || 0
        }
    })
    var sortedArrayOfObj = arrayOfObj.sort(function(a, b) {
        return b.data-a.data
        // return b.data>a.data
    })
    var newLabelArray = []
    var newDataArray = []
    sortedArrayOfObj.forEach(function(d){
        newLabelArray.push(d.label)
        newDataArray.push(d.data)
    })
    return [newDataArray, newLabelArray]
}

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

// ------------------------------------------------------------------------- //
// Chart definitions
// ------------------------------------------------------------------------- //
const faceColors = [
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(52, 179, 96, 1)',
    'rgba(152, 36, 201, 1)',
    'rgba(255, 187, 0, 1)',
    'rgba(230, 0, 0, 1)',
    'rgba(14, 0, 171, 1)',
    'rgba(65, 125, 0, 1)'
]

const fillColors = [
    'rgba(255, 99, 132, 0.2)',
    'rgba(54, 162, 235, 0.2)',
    'rgba(52, 179, 96, 0.2)',
    'rgba(152, 36, 201, 0.2)',
    'rgba(255, 187, 0, 0.2)',
    'rgba(230, 0, 0, 0.2)',
    'rgba(14, 0, 171, 0.2)',
    'rgba(65, 125, 0, 0.2)'
]

function plot(data, ctx, title=undefined, xlabel=undefined, ylabel=undefined, type='line', scale=undefined) {
    let displayLegend = data.datasets[0].hasOwnProperty('label') ? true : false
    let stacked = (type == 'bar') ? true : false
    let min = (scale == undefined) ? undefined : scale[0]
    let max = (scale == undefined) ? undefined : scale[1]
    const config = {
        type: type,
        data: data,
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: xlabel
                    },
                    stacked: true
                },
                y: {
                    ticks: {
                        callback: function(val, index) {// Fix RangeError: minimumFractionDigits value is out of range.
                            return val
                        }
                    },
                    title: {
                        display: true,
                        text: ylabel
                    },
                    stacked: stacked,
                    min: min,
                    max: max
                }
            },
            plugins: {
                legend: {display: displayLegend},
                title: {
                    display: true,
                    text: title
                }
            }
        }
    }
    new Chart(ctx, config)
}

// ------------------------------------------------------------------------- //
// Fill pages
// ------------------------------------------------------------------------- //
function parseWallet(filteredWalletHistory) {
    let minDate = undefined
    let maxDate = undefined
    let currentWallet = undefined
    let marketsList = []
    let classesList = []
    let overallValues = {}
    for(i in filteredWalletHistory){
        var w = filteredWalletHistory[i]// Wallet in a given date
        // var date = new Date(w.date)// TODO: fix timezone
        var date = w.date.split('T')[0]
        var rf = 0
        var rv = 0
        var cripto = 0
        for(j in w.wallet){
            var asset = w.wallet[j]
            if(asset.class == 'RF'){
                rf += asset.value_brl
            }else if(asset.class == 'RV'){
                rv += asset.value_brl
            }else if(asset.class == 'Cripto'){
                cripto += asset.value_brl
            }else{
                console.log('Unexpected asset class: '+asset.class)
            }
            if(!marketsList.includes(asset.market)){
                marketsList.push(asset.market)
            }
            if(!classesList.includes(asset.class)){
                classesList.push(asset.class)
            }
        }
        overallValues[date] = {'RF': rf, 'RV': rv, 'Cripto': cripto, 'Total': rf+rv+cripto}
        if(date < minDate || minDate == undefined){
            minDate = date
        }
        if(date > maxDate || maxDate == undefined){
            maxDate = date
            currentWallet = w.wallet
        }
    }
    let variableIncome = []
    for(i in currentWallet){
        var asset = currentWallet[i]
        if(asset.class == 'RV'){
            variableIncome.push(asset)
        }
    }
    return [marketsList, classesList, [minDate, maxDate], currentWallet, overallValues, variableIncome]
}

function updateTabOverviewSectionHistory(dateRange, overallValues) {
    // Fill text
    var minDate = dateRange[0]
    var maxDate = dateRange[1]

    let Return = overallValues[maxDate]['Total']-overallValues[minDate]['Total']
    let returnPct = Return/overallValues[minDate]['Total']
    document.getElementById('return').innerText = `Retorno no período: ${currencyFormat.format(Return)} (${percentFormat.format(returnPct)})`

    // Make plots
    let time = Object.keys(overallValues)
    time.sort()
    let rfPct = []
    let rvPct = []
    let criptoPct = []
    let total = []
    for(i in time){
        var t = overallValues[time[i]]['Total']
        total.push(t)
        rfPct.push(100*overallValues[time[i]]['RF']/t)
        rvPct.push(100*overallValues[time[i]]['RV']/t)
        criptoPct.push(100*overallValues[time[i]]['Cripto']/t)
    }

    var data = {
        labels: time,
        datasets: [{
            data: total,
            backgroundColor: fillColors[0],
            borderColor: faceColors[0],
            borderWidth: 4,
            fill: true,
            tension: 0.2
        }]
    }
    var ctx = document.getElementById('chart-overview1').getContext('2d')
    plot(data, ctx, title='Valor da carteira', xlabel=undefined, ylabel='R$')

    var data = {
        labels: time,
        datasets: [{
            label: 'Renda fixa',
            data: rfPct,
            // backgroundColor: faceColors[0],
            backgroundColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 0,
        },{
            label: 'Renda variável',
            data: rvPct,
            // backgroundColor: faceColors[1],
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderWidth: 0,
        },{
            label: 'Cripto',
            data: criptoPct,
            // backgroundColor: faceColors[2],
            backgroundColor: 'rgba(255, 99, 132, 0.3)',
            borderWidth: 0,
        }]
    }
    var ctx = document.getElementById('chart-overview2').getContext('2d')
    plot(data, ctx, title='Composição da carteira', xlabel=undefined, ylabel='%', type='bar', scale=[0, 100])
}

function updateTabOverviewSectionCurrent(currentDate, currentWallet) {
    // Current wallet
    var currentValueByMarket = {}
    var currentValueByClass = {}
    for(i in currentWallet){
        var asset = currentWallet[i]
        var value = asset.value*asset.currency_rate
        currentValueByMarket[asset.market] = (currentValueByMarket[asset.market] == undefined) ? value : currentValueByMarket[asset.market]+value
        currentValueByClass[asset.class] = (currentValueByClass[asset.class] == undefined) ? value : currentValueByClass[asset.class]+value
    }

    var t = Object.values(currentValueByMarket).reduce((a, b) => a + b, 0)
    var values = Object.values(currentValueByMarket)
    var valuesPct = []
    for(i in values){valuesPct.push(100*values[i]/t)}
    var data = {
        labels: Object.keys(currentValueByMarket),
        datasets: [{
            data: valuesPct,
            backgroundColor: faceColors[0],
            borderWidth: 0,
        }]
    }
    var ctx = document.getElementById('chart-overview3').getContext('2d')
    plot(data, ctx, title='Por localidade', xlabel=undefined, ylabel='%', type='bar')

    var t = Object.values(currentValueByClass).reduce((a, b) => a + b, 0)
    var values = Object.values(currentValueByClass)
    var valuesPct = []
    for(i in values){valuesPct.push(100*values[i]/t)}
    var data = {
        labels: Object.keys(currentValueByClass),
        datasets: [{
            data: valuesPct,
            backgroundColor: faceColors[0],
            borderWidth: 0,
        }]
    }
    var ctx = document.getElementById('chart-overview4').getContext('2d')
    plot(data, ctx, title='Por classe de investimento', xlabel=undefined, ylabel='%', type='bar')

    // Fill text and table
    document.getElementById('current-date').innerText = `Última atualização: ${currentDate}`
    let table = document.getElementById('assets-table-body')
    table.innerText = ''

    for(a in currentWallet){
        var asset = currentWallet[a]
        var html = `<tr><td>${Number(a)+1}</td>`
        html += `<td>${asset.asset_name}</td>`
        html += `<td>${asset.market}</td>`
        html += `<td>${asset.class}</td>`
        html += `<td>${new Intl.NumberFormat('pt').format(asset.quantity)}</td>`
        html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: asset.currency}).format(asset.cost)}</td>`
        html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: asset.currency}).format(asset.value)}</td>`
        var gain = asset.value-asset.cost
        var gainPtc = gain/asset.cost
        var style = (gain > 0) ? ' style="color: green;"' : (gain < 0) ? ' style="color: red;"' : ''
        html += `<td${style}>${new Intl.NumberFormat('pt', {style: 'currency', currency: asset.currency}).format(gain)} (${percentFormat.format(gainPtc)})</td></tr>`
        table.insertAdjacentHTML('beforeend', html)
    }
}

function updateTabVariableIncome(wallet){
    var valueByType = {}
    for(i in wallet){
        var asset = wallet[i]
        var value = asset.value_brl
        valueByType[asset.type] = (valueByType[asset.type] == undefined) ? value : valueByType[asset.type]+value
    }

    var labels = Object.keys(valueByType)
    var values = Object.values(valueByType)
    var t = values.reduce((a, b) => a + b, 0)// sum array elements
    var valuesPct = []
    for(i in values){valuesPct.push(100*values[i]/t)}
    var [valuesPct, labels] = sortLabeledData(valuesPct, labels)
    var data = {
        labels: labels,
        datasets: [{
            data: valuesPct,
            backgroundColor: faceColors[0],
            borderWidth: 0,
        }]
    }
    var ctx = document.getElementById('chart-variable1').getContext('2d')
    plot(data, ctx, title='Título', xlabel=undefined, ylabel='%', type='bar')
}

function clearTabOverviewSectionHistory(){
    document.getElementById('chart-overview1').remove()
    document.getElementById('chart-overview1-wrapper').innerHTML = '<canvas id="chart-overview1" width="40" height="40"></canvas>'
    document.getElementById('chart-overview2').remove()
    document.getElementById('chart-overview2-wrapper').innerHTML = '<canvas id="chart-overview2" width="40" height="40"></canvas>'
}

function clearTabOverviewSectionCurrent(){
    document.getElementById('chart-overview3').remove()
    document.getElementById('chart-overview3-wrapper').innerHTML = '<canvas id="chart-overview3" width="40" height="40"></canvas>'
    document.getElementById('chart-overview4').remove()
    document.getElementById('chart-overview4-wrapper').innerHTML = '<canvas id="chart-overview4" width="40" height="40"></canvas>'
}

function clearTabVariableIncome(){
    document.getElementById('chart-variable1').remove()
    document.getElementById('chart-variable1-wrapper').innerHTML = '<canvas id="chart-variable1" width="40" height="40"></canvas>'
}

// ------------------------------------------------------------------------- //
// Filters
// ------------------------------------------------------------------------- //
function populateFilterCheckboxes(allMarkets, allClasses) {
    let marketWrapperElement = document.getElementById('market-filter-wrapper')
    let classWrapperElement = document.getElementById('class-filter-wrapper')
    for(i in allMarkets){
        var html = `<div class="form-check"><input class="form-check-input" type="checkbox" name="market-filter" value="${allMarkets[i]}" checked><label class="form-check-label">${allMarkets[i]}</label></div>`
        marketWrapperElement.insertAdjacentHTML('beforeend', html)
    }
    for(i in allClasses){
        var html = `<div class="form-check"><input class="form-check-input" type="checkbox" name="class-filter" value="${allClasses[i]}" checked><label class="form-check-label">${allClasses[i]}</label></div>`
        classWrapperElement.insertAdjacentHTML('beforeend', html)
    }
}

document.getElementById('btn-apply-filters').onclick = function(){
    let selected = document.querySelector("input[name='timeFilter']:checked").value
    if(selected == 1){// No ano
        var beginFilter = new Date(now.getFullYear(), 0, 1)
    }else if(selected == 2){// 6 meses
        var beginFilter = new Date(now.getTime()-182*24*60*60*1000)// Datetime in ms
    }else if(selected == 3){// 12 meses
        var beginFilter = new Date(now.getTime()-365*24*60*60*1000)
    }else if(selected == 4){// 5 anos
        var beginFilter = new Date(now.getTime()-5*365*24*60*60*1000)
    }else{
        var beginFilter = new Date(0)// Any old date works
    }
    if(beginFilter < startDate){// Wider time span - more inclusive wallet - new request needed
        startDate = beginFilter
        let timeFilter = {
            year: startDate.getFullYear(),
            month: startDate.getMonth()+1
        }
        makeRequest('POST', apiURL+'/load-wallet', data=timeFilter, inclusiveWalletCallback)
    }else{// No request
        let filteredWalletHistory = []
        for(i in walletHistory){
            var date = new Date(walletHistory[i].date)
            if(date >= beginFilter){
                filteredWalletHistory.push(walletHistory[i])
            }
        }
        filteredWalletHistory = filterMarketAndClass(filteredWalletHistory)
        let [marketsList, classesList, dateRange, currentWallet, overallValues, variableIncome] = parseWallet(filteredWalletHistory)
        clearTabOverviewSectionHistory()
        updateTabOverviewSectionHistory(dateRange, overallValues)
        clearTabOverviewSectionCurrent()
        updateTabOverviewSectionCurrent(dateRange[1], currentWallet)
        clearTabVariableIncome()
        updateTabVariableIncome(variableIncome)
        }
}

function filterMarketAndClass(walletToFilter) {
    let checkedMarkets = document.querySelectorAll('input[type=checkbox][name="market-filter"]:checked')
    let checkedClasses = document.querySelectorAll('input[type=checkbox][name="class-filter"]:checked')
    let marketsToFilter = []
    for(i in checkedMarkets) {
        if(checkedMarkets[i].value !== undefined){
            marketsToFilter.push(checkedMarkets[i].value)
        }
    }
    let classesToFilter = []
    for(i in checkedClasses) {
        if(checkedClasses[i].value !== undefined){
            classesToFilter.push(checkedClasses[i].value)
        }
    }
    let filteredWallet = []
    for(i in walletToFilter){
        var w = walletToFilter[i]
        var assetsInCurrentWallet = []
        for(j in w.wallet){
            var asset = w.wallet[j]
            if(marketsToFilter.includes(asset.market) & classesToFilter.includes(asset.class)){
                assetsInCurrentWallet.push(asset)
            }
        }
        if(assetsInCurrentWallet.length > 0){
            filteredWallet.push({
                date: w.date,
                wallet: assetsInCurrentWallet
            })
        }
    }
    return filteredWallet
}

// ------------------------------------------------------------------------- //
// Initial definitions and parameters
// ------------------------------------------------------------------------- //
// const apiURL = 'https://labs-api-investe.herokuapp.com'
const apiURL = 'http://127.0.0.1:5000'

// TODO: construir um currencyFormat pra qq moeda
let currencyFormat = new Intl.NumberFormat('pt', {style: 'currency', currency: 'BRL'})
let percentFormat = new Intl.NumberFormat('pt', {style: 'percent', minimumFractionDigits: 1})

let walletHistory = undefined
let now = new Date()
let startDate = new Date(now.getFullYear()-1, now.getMonth(), now.getDate())
let timeFilter = {
    year: startDate.getFullYear(),
    month: startDate.getMonth()+1
}

function firstRequestCallback(response) {
    walletHistory = response
    for(i in walletHistory){
        for(j in walletHistory[i].wallet){
            walletHistory[i].wallet[j]['value_brl'] = walletHistory[i].wallet[j]['value']*walletHistory[i].wallet[j]['currency_rate']
        }
    }
    let [marketsList, classesList, dateRange, currentWallet, overallValues, variableIncome] = parseWallet(walletHistory)
    populateFilterCheckboxes(marketsList, classesList)
    updateTabOverviewSectionHistory(dateRange, overallValues)
    updateTabOverviewSectionCurrent(dateRange[1], currentWallet)
    updateTabVariableIncome(variableIncome)
}

function inclusiveWalletCallback(response) {
    walletHistory = response
    for(i in walletHistory){
        for(j in walletHistory[i].wallet){
            walletHistory[i].wallet[j]['value_brl'] = walletHistory[i].wallet[j]['value']*walletHistory[i].wallet[j]['currency_rate']
        }
    }
    filteredWalletHistory = filterMarketAndClass(walletHistory)
    let [marketsList, classesList, dateRange, currentWallet, overallValues, variableIncome] = parseWallet(filteredWalletHistory)
    clearTabOverviewSectionHistory()
    updateTabOverviewSectionHistory(dateRange, overallValues)
    clearTabOverviewSectionCurrent()
    updateTabOverviewSectionCurrent(dateRange[1], currentWallet)
    clearTabVariableIncome()
    updateTabVariableIncome(variableIncome)
}

function onLoad() {
    makeRequest('POST', apiURL+'/load-wallet', timeFilter, firstRequestCallback)
}

document.addEventListener('load', onLoad())
