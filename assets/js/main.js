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
        // return b.data>a.data// FF
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
    let currentFixedIncome = []
    let currentVariableIncome = []
    let overallVariableIncome = {}
    let currentCripto = []
    let overallCripto = {}
    let marketsList = []
    let classesList = []
    let overallValues = {}
    for(i in filteredWalletHistory){
        var w = filteredWalletHistory[i]// Wallet in a given date
        var date = w.date.split('T')[0]
        var rf = 0
        var rv = 0
        var cripto = 0
        overallVariableIncome[date] = {}
        overallCripto[date] = {}
        for(j in w.wallet){
            var asset = w.wallet[j]
            if(asset.class == 'RF'){
                rf += asset.value_brl
            }else if(asset.class == 'RV'){
                rv += asset.value_brl
                if(overallVariableIncome[date][asset.type] == undefined){
                    overallVariableIncome[date][asset.type] = asset.value_brl
                }else{
                    overallVariableIncome[date][asset.type] += asset.value_brl
                }
            }else if(asset.class == 'Cripto'){
                cripto += asset.value_brl
                if(overallCripto[date][asset.type] == undefined){
                    overallCripto[date][asset.type] = asset.value_brl
                }else{
                    overallCripto[date][asset.type] += asset.value_brl
                }
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
        overallVariableIncome[date]['Total'] = Object.values(overallVariableIncome[date]).reduce((a, b) => a + b, 0)
        overallCripto[date]['Total'] = Object.values(overallCripto[date]).reduce((a, b) => a + b, 0)
        if(date < minDate || minDate == undefined){
            minDate = date
        }
        if(date > maxDate || maxDate == undefined){
            maxDate = date
            currentWallet = w.wallet
        }
    }
    for(i in currentWallet){
        var asset = currentWallet[i]
        if(asset.class == 'RF'){
            currentFixedIncome.push(asset)
        }else if(asset.class == 'RV'){
            currentVariableIncome.push(asset)
        }else if(asset.class == 'Cripto'){
            currentCripto.push(asset)
        }
    }
    var obj = {
        'marketsList': marketsList,
        'classesList': classesList,
        'dateRange': [minDate, maxDate],
        'overallValues': overallValues,
        'currentWallet': currentWallet,
        'currentFixedIncome': currentFixedIncome,
        'overallVariableIncome': overallVariableIncome,
        'currentVariableIncome': currentVariableIncome,
        'overallCripto': overallCripto,
        'currentCripto': currentCripto
    }
    return obj
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

function updateTabFixedIncomeSectionHistory(currentWallet){
    let allTypes = []
    for(i in currentWallet){
        var type = currentWallet[i].type
        if(!allTypes.includes(type)) allTypes.push(type)
    }
    return allTypes
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

function updateTabFixedIncomeSectionCurrent(currentDate, wallet){
    // Text
    document.getElementById('current-date-fixedincome-tab').innerText = `Última atualização: ${currentDate}`

    // Plot
    var costByType = {}
    var valueByType = {}
    var valueByExpiration = {}
    var minExpYear = 2200
    var maxExpYear = 0
    for(i in wallet){
        var asset = wallet[i]
        var cost = asset.cost_brl
        var value = asset.value_brl
        costByType[asset.type] = (costByType[asset.type] == undefined) ? cost : costByType[asset.type]+cost
        valueByType[asset.type] = (valueByType[asset.type] == undefined) ? value : valueByType[asset.type]+value
        var expYear = new Date(asset.expire).getUTCFullYear()
        if(expYear == 2200){continue}// Exclui ativos sem data de vencimento (cadastrados com vencimento em 2200)
        if(expYear < minExpYear){minExpYear = expYear}
        if(expYear > maxExpYear){maxExpYear = expYear}
        if(valueByExpiration[asset.type] == undefined){
            valueByExpiration[asset.type] = {}
            valueByExpiration[asset.type][expYear] = value
        }else{
            if(valueByExpiration[asset.type][expYear] == undefined){
                valueByExpiration[asset.type][expYear] = value
            }else{
                valueByExpiration[asset.type][expYear] += value
            }
        }
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
    var ctx = document.getElementById('chart-fixed2').getContext('2d')
    plot(data, ctx, title='Composição da carteira', xlabel=undefined, ylabel='%', type='bar')

    // Table
    let table = document.getElementById('fixed-current-table-body')
    for(i in labels){
        var html = `<tr><td>${Number(i)+1}</td>`
        html += `<td>${labels[i]}</td>`
        var cost = costByType[labels[i]]
        html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: 'BRL'}).format(cost)}</td>`
        var value = valueByType[labels[i]]
        html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: 'BRL'}).format(value)}</td>`
        var gain = value-cost
        var gainPtc = gain/cost
        var style = (gain > 0) ? ' style="color: green;"' : (gain < 0) ? ' style="color: red;"' : ''
        html += `<td${style}>${new Intl.NumberFormat('pt', {style: 'currency', currency: 'BRL'}).format(gain)} (${percentFormat.format(gainPtc)})</td></tr>`
        table.insertAdjacentHTML('beforeend', html)
    }

    // Plot 2
    var types = Object.keys(valueByExpiration)
    let datasets = []
    for(t in types){
        var data = []
        for(var y=minExpYear; y<=maxExpYear; y++){
            var val = (valueByExpiration[types[t]][y] == undefined) ? 0 : valueByExpiration[types[t]][y]
            data.push(val)
        }
        datasets.push({
            data: data,
            label: types[t],
            backgroundColor: faceColors[t],
            borderWidth: 0,
            fill: false,
        })
    }
    var labels = []
    for(var y=minExpYear; y<=maxExpYear; y++){labels.push(y)}
    var data = {
        labels: labels,
        datasets: datasets
    }
    var ctx = document.getElementById('chart-fixed3').getContext('2d')
    plot(data, ctx, title='Valores por data de vencimento dos títulos', xlabel=undefined, ylabel='R$', type='bar')
}

function updateTabVariableIncomeSectionHistory(dateRange, overallVariableIncome){
    // Text
    var minDate = dateRange[0]
    var maxDate = dateRange[1]

    var Return = overallVariableIncome[maxDate]['Total']-overallVariableIncome[minDate]['Total']
    var returnPct = Return/overallVariableIncome[minDate]['Total']
    document.getElementById('return-variableincome-tab').innerText = `Retorno no período: ${currencyFormat.format(Return)} (${percentFormat.format(returnPct)})`

    // Plot
    let allTypes = []
    for(date in overallVariableIncome){
        var types = Object.keys(overallVariableIncome[date])
        for(t in types){
            if(!allTypes.includes(types[t])){allTypes.push(types[t])}
        }
    }
    allDates = Object.keys(overallVariableIncome)

    let emptyDates = allDates.reduce((a, key) => {// {date1: undefined, ...}
        a[key] = undefined
        return a
    }, {})
    let transposeOverall = allTypes.reduce((a, key) => {// {type1: {}, ...}
        a[key] = structuredClone(emptyDates)
        return a
    }, {})

    for(t in allTypes){
        for(d in allDates){
            var val = overallVariableIncome[allDates[d]][allTypes[t]]
            if(val != undefined){
                transposeOverall[allTypes[t]][allDates[d]] = val
            }
        }
    }

    var types = Object.keys(transposeOverall)
    let datasets = []
    for(t in types){
        if(types[t] == 'Total'){continue}
        datasets.push({
            data: Object.values(transposeOverall[types[t]]),
            label: types[t],
            backgroundColor: fillColors[t],
            borderColor: faceColors[t],
            borderWidth: 4,
            fill: false,
            tension: 0.2
        })
    }
    var labels = Object.keys(transposeOverall[types[0]])
    var data = {
        labels: labels,
        datasets: datasets
    }
    var ctx = document.getElementById('chart-variable1').getContext('2d')
    plot(data, ctx, title='Grupos de ativos', xlabel=undefined, ylabel='R$', type='bar')

    // Table
    var minDate = dateRange[0]
    var maxDate = dateRange[1]
    let table = document.getElementById('variable-history-table-body')
    table.innerText = ''
    for(t in allTypes){
        if(allTypes[t] == 'Total'){continue}
        var html = `<tr><td>${Number(t)+1}</td>`
        html += `<td>${allTypes[t]}</td>`
        var valIni = transposeOverall[allTypes[t]][minDate]
        html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: 'BRL'}).format(valIni)}</td>`
        var valCurr = transposeOverall[allTypes[t]][maxDate]
        html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: 'BRL'}).format(valCurr)}</td>`
        var Return = valCurr-valIni
        var returnPtc = Return/valIni
        var style = (Return > 0) ? ' style="color: green;"' : (Return < 0) ? ' style="color: red;"' : ''
        html += `<td${style}>${new Intl.NumberFormat('pt', {style: 'currency', currency: 'BRL'}).format(Return)} (${percentFormat.format(returnPtc)})</td></tr>`
        table.insertAdjacentHTML('beforeend', html)
    }
    return allTypes
}

function updateTabVariableIncomeSectionCurrent(currentDate, wallet){
    // Text
    document.getElementById('current-date-variableincome-tab').innerText = `Última atualização: ${currentDate}`

    // Plot
    var costByType = {}
    var valueByType = {}
    for(i in wallet){
        var asset = wallet[i]
        var cost = asset.cost_brl
        var value = asset.value_brl
        costByType[asset.type] = (costByType[asset.type] == undefined) ? cost : costByType[asset.type]+cost
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
    var ctx = document.getElementById('chart-variable2').getContext('2d')
    plot(data, ctx, title='Composição da carteira', xlabel=undefined, ylabel='%', type='bar')

    // Table
    let table = document.getElementById('variable-current-table-body')
    for(i in labels){
        var html = `<tr><td>${Number(i)+1}</td>`
        html += `<td>${labels[i]}</td>`
        var cost = costByType[labels[i]]
        html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: 'BRL'}).format(cost)}</td>`
        var value = valueByType[labels[i]]
        html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: 'BRL'}).format(value)}</td>`
        var gain = value-cost
        var gainPtc = gain/cost
        var style = (gain > 0) ? ' style="color: green;"' : (gain < 0) ? ' style="color: red;"' : ''
        html += `<td${style}>${new Intl.NumberFormat('pt', {style: 'currency', currency: 'BRL'}).format(gain)} (${percentFormat.format(gainPtc)})</td></tr>`
        table.insertAdjacentHTML('beforeend', html)
    }
}

function updateTabCriptoSectionHistory(dateRange, overallCripto){
    // Text
    var minDate = dateRange[0]
    var maxDate = dateRange[1]

    var Return = overallCripto[maxDate]['Total']-overallCripto[minDate]['Total']
    var returnPct = Return/overallCripto[minDate]['Total']
    document.getElementById('return-cripto-tab').innerText = `Retorno no período: ${currencyFormat.format(Return)} (${percentFormat.format(returnPct)})`

    // Plot
    let allTypes = []
    for(date in overallCripto){
        var types = Object.keys(overallCripto[date])
        for(t in types){
            if(!allTypes.includes(types[t])){allTypes.push(types[t])}
        }
    }
    allDates = Object.keys(overallCripto)

    let emptyDates = allDates.reduce((a, key) => {// {date1: undefined, ...}
        a[key] = undefined
        return a
    }, {})
    let transposeOverall = allTypes.reduce((a, key) => {// {type1: {}, ...}
        a[key] = structuredClone(emptyDates)
        return a
    }, {})

    for(t in allTypes){
        for(d in allDates){
            var val = overallCripto[allDates[d]][allTypes[t]]
            if(val != undefined){
                transposeOverall[allTypes[t]][allDates[d]] = val
            }
        }
    }

    var types = Object.keys(transposeOverall)
    let datasets = []
    for(t in types){
        if(types[t] == 'Total'){continue}
        datasets.push({
            data: Object.values(transposeOverall[types[t]]),
            label: types[t],
            backgroundColor: fillColors[t],
            borderColor: faceColors[t],
            borderWidth: 4,
            fill: false,
            tension: 0.2
        })
    }
    var labels = Object.keys(transposeOverall[types[0]])
    var data = {
        labels: labels,
        datasets: datasets
    }
    var ctx = document.getElementById('chart-cripto1').getContext('2d')
    plot(data, ctx, title='Grupos de ativos', xlabel=undefined, ylabel='R$', type='bar')

    // Table
    var minDate = dateRange[0]
    var maxDate = dateRange[1]
    let table = document.getElementById('cripto-history-table-body')
    for(t in allTypes){
        if(allTypes[t] == 'Total'){continue}
        var html = `<tr><td>${Number(t)+1}</td>`
        html += `<td>${allTypes[t]}</td>`
        var valIni = transposeOverall[allTypes[t]][minDate]
        html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: 'BRL'}).format(valIni)}</td>`
        var valCurr = transposeOverall[allTypes[t]][maxDate]
        html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: 'BRL'}).format(valCurr)}</td>`
        var Return = valCurr-valIni
        var returnPtc = Return/valIni
        var style = (Return > 0) ? ' style="color: green;"' : (Return < 0) ? ' style="color: red;"' : ''
        html += `<td${style}>${new Intl.NumberFormat('pt', {style: 'currency', currency: 'BRL'}).format(Return)} (${percentFormat.format(returnPtc)})</td></tr>`
        table.insertAdjacentHTML('beforeend', html)
    }
    return allTypes
}

function updateTabCriptoSectionCurrent(currentDate, wallet){
    // Text
    document.getElementById('current-date-cripto-tab').innerText = `Última atualização: ${currentDate}`

    // Plot
    var costByType = {}
    var valueByType = {}
    for(i in wallet){
        var asset = wallet[i]
        var cost = asset.cost_brl
        var value = asset.value_brl
        costByType[asset.type] = (costByType[asset.type] == undefined) ? cost : costByType[asset.type]+cost
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
    var ctx = document.getElementById('chart-cripto2').getContext('2d')
    plot(data, ctx, title='Composição da carteira', xlabel=undefined, ylabel='%', type='bar')

    // Table
    let table = document.getElementById('cripto-current-table-body')
    for(i in labels){
        var html = `<tr><td>${Number(i)+1}</td>`
        html += `<td>${labels[i]}</td>`
        var cost = costByType[labels[i]]
        html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: 'BRL'}).format(cost)}</td>`
        var value = valueByType[labels[i]]
        html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: 'BRL'}).format(value)}</td>`
        var gain = value-cost
        var gainPtc = gain/cost
        var style = (gain > 0) ? ' style="color: green;"' : (gain < 0) ? ' style="color: red;"' : ''
        html += `<td${style}>${new Intl.NumberFormat('pt', {style: 'currency', currency: 'BRL'}).format(gain)} (${percentFormat.format(gainPtc)})</td></tr>`
        table.insertAdjacentHTML('beforeend', html)
    }
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

function clearTabFixedIncomeSectionCurrent(){
    document.getElementById('current-date-fixedincome-tab').innerText = ''
    document.getElementById('fixed-current-table-body').innerText = ''
    document.getElementById('chart-fixed2').remove()
    document.getElementById('chart-fixed2-wrapper').innerHTML = '<canvas id="chart-fixed2" width="40" height="40"></canvas>'
    document.getElementById('chart-fixed3').remove()
    document.getElementById('chart-fixed3-wrapper').innerHTML = '<canvas id="chart-fixed3" width="40" height="20"></canvas>'
}

function clearTabFixedIncomeSectionType(){
    document.getElementById('fixed-income-select-type').innerHTML = '<option value="0" selected>- Grupos -</option>'
    document.getElementById('fixed-income-type-table-body').innerText = ''
    document.getElementById('chart-fixed4').remove()
    document.getElementById('chart-fixed4-wrapper').innerHTML = '<canvas id="chart-fixed4" width="40" height="40"></canvas>'
}

function clearTabVariableIncomeSectionHistory(){
    document.getElementById('return-variableincome-tab').innerText = ''
    document.getElementById('variable-history-table-body').innerText = ''
    document.getElementById('chart-variable1').remove()
    document.getElementById('chart-variable1-wrapper').innerHTML = '<canvas id="chart-variable1" width="40" height="40"></canvas>'
}

function clearTabVariableIncomeSectionCurrent(){
    document.getElementById('current-date-variableincome-tab').innerText = ''
    document.getElementById('variable-current-table-body').innerText = ''
    document.getElementById('chart-variable2').remove()
    document.getElementById('chart-variable2-wrapper').innerHTML = '<canvas id="chart-variable2" width="40" height="40"></canvas>'
}

function clearTabVariableIncomeSectionType(){
    document.getElementById('var-income-select-type').innerHTML = '<option value="0" selected>- Grupos -</option>'
    document.getElementById('variable-type-table-body').innerText = ''
    document.getElementById('chart-variable3').remove()
    document.getElementById('chart-variable3-wrapper').innerHTML = '<canvas id="chart-variable3" width="40" height="40"></canvas>'
}

function clearTabCriptoSectionHistory(){
    document.getElementById('return-cripto-tab').innerText = ''
    document.getElementById('cripto-history-table-body').innerText = ''
    document.getElementById('chart-cripto1').remove()
    document.getElementById('chart-cripto1-wrapper').innerHTML = '<canvas id="chart-cripto1" width="40" height="40"></canvas>'
}

function clearTabCriptoSectionCurrent(){
    document.getElementById('current-date-cripto-tab').innerText = ''
    document.getElementById('cripto-current-table-body').innerText = ''
    document.getElementById('chart-cripto2').remove()
    document.getElementById('chart-cripto2-wrapper').innerHTML = '<canvas id="chart-cripto2" width="40" height="40"></canvas>'
}

function clearTabCriptoSectionType(){
    document.getElementById('cripto-select-type').innerHTML = '<option value="0" selected>- Grupos -</option>'
    document.getElementById('cripto-type-table-body').innerText = ''
    document.getElementById('chart-cripto3').remove()
    document.getElementById('chart-cripto3-wrapper').innerHTML = '<canvas id="chart-cripto3" width="40" height="40"></canvas>'
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
        let pw = parseWallet(filteredWalletHistory)
        currentFixedIncome = pw.currentFixedIncome
        currentVariableIncome = pw.currentVariableIncome
        currentCripto = pw.currentCripto
        clearTabOverviewSectionHistory()
        updateTabOverviewSectionHistory(pw.dateRange, pw.overallValues)
        clearTabOverviewSectionCurrent()
        updateTabOverviewSectionCurrent(pw.dateRange[1], pw.currentWallet)
        clearTabFixedIncomeSectionCurrent()
        clearTabFixedIncomeSectionType()
        if(pw.classesList.includes('RF')){
            var allFITypes = updateTabFixedIncomeSectionHistory(pw.currentFixedIncome)
            updateTabFixedIncomeSectionCurrent(pw.dateRange[1], pw.currentFixedIncome)
            populateDropDown(allFITypes, 'fixed-income-select-type')
        }
        clearTabVariableIncomeSectionHistory()
        clearTabVariableIncomeSectionCurrent()
        clearTabVariableIncomeSectionType()
        if(pw.classesList.includes('RV')){
            var allTypes = updateTabVariableIncomeSectionHistory(pw.dateRange, pw.overallVariableIncome)
            updateTabVariableIncomeSectionCurrent(pw.dateRange[1], pw.currentVariableIncome)
            populateDropDown(allTypes, 'var-income-select-type')
        }
        clearTabCriptoSectionHistory()
        clearTabCriptoSectionCurrent()
        clearTabCriptoSectionType()
        if(pw.classesList.includes('Cripto')){
            var allCriptoTypes = updateTabCriptoSectionHistory(pw.dateRange, pw.overallCripto)
            updateTabCriptoSectionCurrent(pw.dateRange[1], pw.currentCripto)
            populateDropDown(allCriptoTypes, 'cripto-select-type')
        }
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

function populateDropDown(itemsList, elementID) {
    itemsList = itemsList.filter(item => item !== 'Total')
    itemsList.sort()

    let element = document.getElementById(elementID)
    for(i in itemsList){
        var html = `<option value=${itemsList[i]}>${itemsList[i]}</option>`
        element.insertAdjacentHTML('beforeend', html)
    }
}

document.getElementById('fixed-income-select-type').addEventListener('change', function(){
    let table = document.getElementById('fixed-income-type-table-body')
    table.innerText = ''
    document.getElementById('chart-fixed4').remove()
    document.getElementById('chart-fixed4-wrapper').innerHTML = '<canvas id="chart-fixed4" width="40" height="40"></canvas>'

    var selectedType = this.value
    var filteredFixedIinc = []
    if(selectedType != '0'){
        for(i in currentFixedIncome){
            if(currentFixedIncome[i].type == selectedType){
                filteredFixedIinc.push(currentFixedIncome[i])
            }
        }

        // Plot
        var labels = []
        var dataset = []

        // Table
        for(i in filteredFixedIinc){
            var html = `<tr><td>${Number(i)+1}</td>`
            var assetName = filteredFixedIinc[i].asset_name
            html += `<td>${assetName}</td>`
            var quantity = filteredFixedIinc[i].quantity
            html += `<td>${quantity}</td>`
            var currency = filteredFixedIinc[i].currency
            var cost = filteredFixedIinc[i].cost
            html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: currency}).format(cost)}</td>`
            var value = filteredFixedIinc[i].value
            html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: currency}).format(value)}</td>`
            var gain = value-cost
            var gainPtc = gain/cost
            var style = (gain > 0) ? ' style="color: green;"' : (gain < 0) ? ' style="color: red;"' : ''
            html += `<td${style}>${new Intl.NumberFormat('pt', {style: 'currency', currency: currency}).format(gain)} (${percentFormat.format(gainPtc)})</td></tr>`
            table.insertAdjacentHTML('beforeend', html)
            labels.push(assetName)
            dataset.push(value)
        }

        // Plot
        var [dataset, labels] = sortLabeledData(dataset, labels)
        var data = {
            labels: labels,
            datasets: [{
                data: dataset,
                backgroundColor: faceColors[0],
                borderWidth: 0,
            }]
        }
        var ctx = document.getElementById('chart-fixed4').getContext('2d')
        plot(data, ctx, title='Valor atual', xlabel=undefined, ylabel=currency, type='bar')
    }
})

document.getElementById('var-income-select-type').addEventListener('change', function(){
    let table = document.getElementById('variable-type-table-body')
    table.innerText = ''
    document.getElementById('chart-variable3').remove()
    document.getElementById('chart-variable3-wrapper').innerHTML = '<canvas id="chart-variable3" width="40" height="40"></canvas>'

    var selectedType = this.value
    var filteredVarIinc = []
    if(selectedType != '0'){
        for(i in currentVariableIncome){
            if(currentVariableIncome[i].type == selectedType){
                filteredVarIinc.push(currentVariableIncome[i])
            }
        }

        // Plot
        var labels = []
        var dataset = []

        // Table
        for(i in filteredVarIinc){
            var html = `<tr><td>${Number(i)+1}</td>`
            var assetName = filteredVarIinc[i].asset_name
            html += `<td>${assetName}</td>`
            var quantity = filteredVarIinc[i].quantity
            html += `<td>${quantity}</td>`
            var currency = filteredVarIinc[i].currency
            var cost = filteredVarIinc[i].cost
            html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: currency}).format(cost)}</td>`
            var value = filteredVarIinc[i].value
            html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: currency}).format(value)}</td>`
            var gain = value-cost
            var gainPtc = gain/cost
            var style = (gain > 0) ? ' style="color: green;"' : (gain < 0) ? ' style="color: red;"' : ''
            html += `<td${style}>${new Intl.NumberFormat('pt', {style: 'currency', currency: currency}).format(gain)} (${percentFormat.format(gainPtc)})</td></tr>`
            table.insertAdjacentHTML('beforeend', html)
            labels.push(assetName)
            dataset.push(value)
        }

        // Plot
        var [dataset, labels] = sortLabeledData(dataset, labels)
        var data = {
            labels: labels,
            datasets: [{
                data: dataset,
                backgroundColor: faceColors[0],
                borderWidth: 0,
            }]
        }
        var ctx = document.getElementById('chart-variable3').getContext('2d')
        plot(data, ctx, title='Valor atual', xlabel=undefined, ylabel=currency, type='bar')
    }
})

document.getElementById('cripto-select-type').addEventListener('change', function(){
    let table = document.getElementById('cripto-type-table-body')
    table.innerText = ''
    document.getElementById('chart-cripto3').remove()
    document.getElementById('chart-cripto3-wrapper').innerHTML = '<canvas id="chart-cripto3" width="40" height="40"></canvas>'

    var selectedType = this.value
    var filteredCripto = []
    if(selectedType != '0'){
        for(i in currentCripto){
            if(currentCripto[i].type == selectedType){
                filteredCripto.push(currentCripto[i])
            }
        }

        // Plot
        var labels = []
        var dataset = []

        // Table
        for(i in filteredCripto){
            var html = `<tr><td>${Number(i)+1}</td>`
            var assetName = filteredCripto[i].asset_name
            html += `<td>${assetName}</td>`
            var quantity = filteredCripto[i].quantity
            html += `<td>${quantity}</td>`
            var currency = filteredCripto[i].currency
            var cost = filteredCripto[i].cost
            html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: currency}).format(cost)}</td>`
            var value = filteredCripto[i].value
            html += `<td>${new Intl.NumberFormat('pt', {style: 'currency', currency: currency}).format(value)}</td>`
            var gain = value-cost
            var gainPtc = gain/cost
            var style = (gain > 0) ? ' style="color: green;"' : (gain < 0) ? ' style="color: red;"' : ''
            html += `<td${style}>${new Intl.NumberFormat('pt', {style: 'currency', currency: currency}).format(gain)} (${percentFormat.format(gainPtc)})</td></tr>`
            table.insertAdjacentHTML('beforeend', html)
            labels.push(assetName)
            dataset.push(value)
        }

        // Plot
        var [dataset, labels] = sortLabeledData(dataset, labels)
        var data = {
            labels: labels,
            datasets: [{
                data: dataset,
                backgroundColor: faceColors[0],
                borderWidth: 0,
            }]
        }
        var ctx = document.getElementById('chart-cripto3').getContext('2d')
        plot(data, ctx, title='Valor atual', xlabel=undefined, ylabel=currency, type='bar')
    }
})

// ------------------------------------------------------------------------- //
// Initial definitions and parameters
// ------------------------------------------------------------------------- //
let walletHistory = undefined
let currentFixedIncome = undefined
let currentVariableIncome = undefined
let currentCripto = undefined
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
    let pw = parseWallet(walletHistory)
    currentFixedIncome = pw.currentFixedIncome
    currentVariableIncome = pw.currentVariableIncome
    currentCripto = pw.currentCripto
    populateFilterCheckboxes(pw.marketsList, pw.classesList)
    updateTabOverviewSectionHistory(pw.dateRange, pw.overallValues)
    updateTabOverviewSectionCurrent(pw.dateRange[1], pw.currentWallet)
    if(pw.classesList.includes('RF')){
        var allFITypes = updateTabFixedIncomeSectionHistory(pw.currentFixedIncome)
        updateTabFixedIncomeSectionCurrent(pw.dateRange[1], pw.currentFixedIncome)
        populateDropDown(allFITypes, 'fixed-income-select-type')
    }
    if(pw.classesList.includes('RV')){
        var allVITypes = updateTabVariableIncomeSectionHistory(pw.dateRange, pw.overallVariableIncome)
        updateTabVariableIncomeSectionCurrent(pw.dateRange[1], pw.currentVariableIncome)
        populateDropDown(allVITypes, 'var-income-select-type')
    }
    if(pw.classesList.includes('Cripto')){
        var allCriptoTypes = updateTabCriptoSectionHistory(pw.dateRange, pw.overallCripto)
        updateTabCriptoSectionCurrent(pw.dateRange[1], pw.currentCripto)
        populateDropDown(allCriptoTypes, 'cripto-select-type')
    }
}

function inclusiveWalletCallback(response) {
    walletHistory = response
    for(i in walletHistory){
        for(j in walletHistory[i].wallet){
            walletHistory[i].wallet[j]['value_brl'] = walletHistory[i].wallet[j]['value']*walletHistory[i].wallet[j]['currency_rate']
        }
    }
    filteredWalletHistory = filterMarketAndClass(walletHistory)
    let pw = parseWallet(filteredWalletHistory)
    currentFixedIncome = pw.currentFixedIncome
    currentVariableIncome = pw.currentVariableIncome
    currentCripto = pw.currentCripto
    clearTabOverviewSectionHistory()
    updateTabOverviewSectionHistory(pw.dateRange, pw.overallValues)
    clearTabOverviewSectionCurrent()
    updateTabOverviewSectionCurrent(pw.dateRange[1], pw.currentWallet)
    clearTabFixedIncomeSectionCurrent()
    clearTabFixedIncomeSectionType()
    if(pw.classesList.includes('RF')){
        var allFITypes = updateTabFixedIncomeSectionHistory(pw.currentFixedIncome)
        updateTabFixedIncomeSectionCurrent(pw.dateRange[1], pw.currentFixedIncome)
        populateDropDown(allFITypes, 'fixed-income-select-type')
    }
    clearTabVariableIncomeSectionHistory()
    clearTabVariableIncomeSectionCurrent()
    clearTabVariableIncomeSectionType()
    if(pw.classesList.includes('RV')){
        var allTypes = updateTabVariableIncomeSectionHistory(pw.dateRange, pw.overallVariableIncome)
        updateTabVariableIncomeSectionCurrent(pw.dateRange[1], pw.currentVariableIncome)
        populateDropDown(allTypes, 'var-income-select-type')
    }
    clearTabCriptoSectionHistory()
    clearTabCriptoSectionCurrent()
    clearTabCriptoSectionType()
    if(pw.classesList.includes('Cripto')){
        var allCriptoTypes = updateTabCriptoSectionHistory(pw.dateRange, pw.overallCripto)
        updateTabCriptoSectionCurrent(pw.dateRange[1], pw.currentCripto)
        populateDropDown(allCriptoTypes, 'cripto-select-type')
    }
}

function onLoad() {
    makeRequest('POST', apiURL+'/load-wallet', timeFilter, firstRequestCallback)
}

document.addEventListener('load', onLoad())
