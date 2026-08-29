/* global $ */
/* global initialjson, feedback, AnsiUp, dayjs, FileReader, MouseEvent, HTMLAnchorElement */
const expectedClaimVersion = 'v0.5.0'
let isResultTabActive = false
let claimGlobal
let feedbackGlobal

let uuidNode = 1 // zero is root

// Init function. holds actions happening when the page is loading.
$(document).ready(function () {
  // Load initial json, if available
  if (typeof initialjson !== 'undefined') {
    claimGlobal = initialjson
  }
  if (typeof feedback !== 'undefined') {
    feedbackGlobal = feedback
  }
  // Get the URL
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)

  // Get the claim file URL
  const claimFileParam = urlParams.get('claimfile')
  const feedbackFileParam = urlParams.get('feedback')

  console.log('claimfile via url:', claimFileParam)
  console.log('feedbackfile via url:', feedbackFileParam)

  fetchRenderClaimFile(claimFileParam)
  fetchRenderFeedbackFile(feedbackFileParam)

  // First render if local files or url provided files are present
  if (typeof claimGlobal !== 'undefined') {
    renderResultsWithModal()
  }
  const inputElement1 = document.getElementById('feedbackFile')
  inputElement1.addEventListener('change', handleFeedbackFiles, false)
  function handleFeedbackFiles () {
    const fileList = this.files /* now you can work with the file list */
    if (fileList.length) {
      // We have a file to load
      const fileUploaded = new FileReader()
      fileUploaded.addEventListener('load', e => {
        fillFeedback(JSON.parse(fileUploaded.result))
      })
      fileUploaded.readAsText(fileList[0])
    }
    this.value = null
  }

  const inputElement = document.getElementById('formFile')
  inputElement.addEventListener('change', handleFiles, false)
})

// This handler is called when the user selects a scenario with the "choose a scenario" combo box
function selectScenarioHandler () { // eslint-disable-line no-unused-vars
  // only refreshes results tab if it is selected
  if (isResultTabActive === true) {
    refreshResultsTabContent()
  }
}

// Refreshes the results tab content according to user filtering selections, scenario, etc,...
function refreshResultsTabContent () {
  hideAllResultsTabObjects()
  enableFiltersResults()
  isResultTabActive = true
  const selectScenarioComboBox = document.getElementById('selectScenarioComboBox')
  const selectedValue = selectScenarioComboBox.options[selectScenarioComboBox.selectedIndex].value
  if (selectedValue === 'all') {
    showAll()
    disableCheckboxOnShowAll()
  } else {
    enableCheckbox()
    document.getElementById('results-table').setAttribute('hidden', 'hidden')
    enableFiltersResults()
    document.getElementById('optional-checkbox').removeAttribute('hidden')
    document.getElementById('myCheck-mandatory').removeAttribute('hidden')
  }
  makeResultsTableVisible('optional')
  makeResultsTableVisible('mandatory')
}

// displays the optional or mandatory results tables depending on the selected scenario and
// whether the optional/mandatory checkboxes are checked
function makeResultsTableVisible (optionalMandatory) {
  const checkBox = document.getElementById(optionalMandatory + '-checkbox')
  const selectScenarioComboBox = document.getElementById('selectScenarioComboBox')
  const selectedValue = selectScenarioComboBox.options[selectScenarioComboBox.selectedIndex].value
  if (selectedValue === 'faredge') {
    if (checkBox.checked === true) {
      document.getElementById(optionalMandatory + '-far-edge-table').removeAttribute('hidden')
    } else {
      document.getElementById(optionalMandatory + '-far-edge-table').setAttribute('hidden', 'hidden')
    }
  }
  if (selectedValue === 'telco') {
    if (checkBox.checked === true) {
      document.getElementById(optionalMandatory + '-telco-table').removeAttribute('hidden')
    } else {
      document.getElementById(optionalMandatory + '-telco-table').setAttribute('hidden', 'hidden')
    }
  }
  if (selectedValue === 'nontelco') {
    if (checkBox.checked === true) {
      document.getElementById(optionalMandatory + '-non-telco-table').removeAttribute('hidden')
    } else {
      document.getElementById(optionalMandatory + '-non-telco-table').setAttribute('hidden', 'hidden')
    }
  }
  if (selectedValue === 'extended') {
    if (checkBox.checked === true) {
      document.getElementById(optionalMandatory + '-extended-table').removeAttribute('hidden')
    } else {
      document.getElementById(optionalMandatory + '-extended-table').setAttribute('hidden', 'hidden')
    }
  }
}

// Filters test cases displayed in the results tab by state for a given selected scenario and for a given mandatory of optional table
function filterTestCasesBasedOnStateHandler (tableId, tableName, state, mandatoryOptional) { // eslint-disable-line no-unused-vars
  const checkBox = document.getElementById('filter-' + mandatoryOptional + '-' + state + '-' + tableName)
  const show = checkBox.checked
  if (show) {
    checkBox.setAttribute('checked', '')
  } else {
    checkBox.removeAttribute('checked')
  }
  const tableIdClean = tableId.replace(/#/g, '')
  const table = document.getElementById(tableIdClean)
  const elements = table.getElementsByTagName('rh-accordion-header')

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]
    const id = element.getAttribute('data-id')
    if (id === state) {
      if (show === true) {
        element.removeAttribute('hidden')
      } else {
        element.setAttribute('hidden', 'hidden')
      }
    }
  }

  const panelElements = table.getElementsByTagName('rh-accordion-panel')
  for (let i = 0; i < panelElements.length; i++) {
    const element = panelElements[i]
    const id = element.getAttribute('data-id')
    if (id === state) {
      if (show === true) {
        element.removeAttribute('hidden')
      } else {
        element.setAttribute('hidden', 'hidden')
      }
    }
  }
}

// Show the results table for the scenario "All" including all test cases
function showAll () {
  document.getElementById('mandatory-far-edge-table').setAttribute('hidden', 'hidden')
  document.getElementById('mandatory-telco-table').setAttribute('hidden', 'hidden')
  document.getElementById('mandatory-non-telco-table').setAttribute('hidden', 'hidden')
  document.getElementById('mandatory-extended-table').setAttribute('hidden', 'hidden')

  document.getElementById('optional-far-edge-table').setAttribute('hidden', 'hidden')
  document.getElementById('optional-telco-table').setAttribute('hidden', 'hidden')
  document.getElementById('optional-non-telco-table').setAttribute('hidden', 'hidden')
  document.getElementById('optional-extended-table').setAttribute('hidden', 'hidden')

  document.getElementById('results-table').removeAttribute('hidden')
}

// makes the "Download Results" button visible
function disableFiltersResults () {
  document.getElementById('filters').classList.add('read-only')
  document.getElementById('outputs').classList.add('read-only')
  document.getElementById('downloadjsonHandler').setAttribute('disabled', '')
  document.getElementById('download').setAttribute('disabled', '')
}
function enableFiltersResults () {
  document.getElementById('filters').classList.remove('read-only')
  document.getElementById('outputs').classList.remove('read-only')
  document.getElementById('downloadjsonHandler').removeAttribute('disabled')
  document.getElementById('download').removeAttribute('disabled')
}
function disableCheckboxOnShowAll () {
  document.getElementById('mandatoryChecked').classList.add('read-only')
  document.getElementById('optionalChecked').classList.add('read-only')
}
function enableCheckbox () {
  document.getElementById('mandatoryChecked').classList.remove('read-only')
  document.getElementById('optionalChecked').classList.remove('read-only')
}
// hides all result specific objects, including tables, buttons, checkboxes
function hideAllResultsTabObjects () {
  isResultTabActive = false
  document.getElementById('progress-bar').setAttribute('hidden', 'hidden')

  document.getElementById('mandatory-far-edge-table').setAttribute('hidden', 'hidden')
  document.getElementById('mandatory-non-telco-table').setAttribute('hidden', 'hidden')
  document.getElementById('mandatory-extended-table').setAttribute('hidden', 'hidden')
  document.getElementById('mandatory-telco-table').setAttribute('hidden', 'hidden')

  document.getElementById('optional-far-edge-table').setAttribute('hidden', 'hidden')
  document.getElementById('optional-non-telco-table').setAttribute('hidden', 'hidden')
  document.getElementById('optional-extended-table').setAttribute('hidden', 'hidden')
  disableFiltersResults()
}

// fills the "version" tab element with the data from the claim.json passed in input
function fillVersionsElement (input, element) {
  $(element).empty()
  $('<colgroup><col><col></colgroup><thead><tr><th scope="col" data-label="Component">Component</th>' +
    '<th scope="col" data-label="Version">Version</th></tr></thead><tbody>').appendTo($(element))
  for (const key in input) {
    $('<tr><td data-label="Component"><b>' + key + '</b></td><td data-label="Version">' + input[key] + '</td></tr>').appendTo($(element))
  }
  $('</tbody>').appendTo($(element))
}

// gets the claim format version from the claim file
function getClaimVersion (input) {
  const claimVersion = input.claimFormat
  if (typeof claimVersion === 'undefined') {
    return 'nil - claimFormat version not present in claim file'
  }
  const regex = /(v[0-9]\.[0-9]\.[0-9])/
  const matches = claimVersion.match(regex)
  if (matches !== null && matches.length > 1) {
    return matches[1]
  }
  return 'nil - claimFormat version is not in a valid format, check claim file'
}

// fills the "metadata" tab element with the data from the claim.json passed in input
function fillMetadata (input, element) {
  $(element).empty()
  $('<tbody>').appendTo($(element))
  for (const key in input) {
    $('<tr><td><b>' + key + '</b></td><td>' + input[key] + '</td></tr>').appendTo($(element))
  }
  $('</tbody>').appendTo($(element))
}

// Mapping between internal table and display table names
const tableNameMap = {
  faredge: 'Far-Edge',
  telco: 'Telco',
  nontelco: 'Non-Telco',
  extended: 'Extended',
  all: 'All'
}

// computes test case statistics per state
function getTestCaseStats (claimJson, tableName) {
  let testsTotal = 0
  let testsPassed = 0
  let testsSkipped = 0
  let testsFailed = 0
  let testsAborted = 0
  let testsPassedOptional = 0
  let testsSkippedOptional = 0
  let testsFailedOptional = 0
  let testsAbortedOptional = 0
  // Compute number of passed/skipped/failed results
  for (const testIdFromClaim in claimJson) {
    const currentTestResult = claimJson[testIdFromClaim]
    let mandatoryOptional = currentTestResult.categoryClassification.FarEdge

    if (tableName === 'telco') {
      mandatoryOptional = currentTestResult.categoryClassification.Telco
    }
    if (tableName === 'nontelco') {
      mandatoryOptional = currentTestResult.categoryClassification.NonTelco
    }
    if (tableName === 'extended') {
      mandatoryOptional = currentTestResult.categoryClassification.Extended
    }

    if (currentTestResult.state === 'passed') {
      if (mandatoryOptional === 'Mandatory' || tableName === 'all') {
        testsTotal++
        testsPassed++
      } else {
        testsPassedOptional++
      }
    } else if (currentTestResult.state === 'skipped') {
      if (mandatoryOptional === 'Mandatory' || tableName === 'all') {
        testsTotal++
        testsSkipped++
      } else {
        testsSkippedOptional++
      }
    } else if (currentTestResult.state === 'failed') {
      if (mandatoryOptional === 'Mandatory' || tableName === 'all') {
        testsTotal++
        testsFailed++
      } else {
        testsFailedOptional++
      }
    } else if (currentTestResult.state === 'aborted') {
      if (mandatoryOptional === 'Mandatory' || tableName === 'all') {
        testsTotal++
        testsAborted++
      } else {
        testsAbortedOptional++
      }
    }
  }

  return {
    testsTotal,
    testsPassed,
    testsSkipped,
    testsFailed,
    testsAborted,
    testsPassedOptional,
    testsSkippedOptional,
    testsFailedOptional,
    testsAbortedOptional
  }
}

// generates HTML for test case stats element
function generateTestCasesStatsElement (tableElement, tableName, optionalMandatory, colorFailed, testsTotal, testsPassed, testsSkipped, testsFailed, testsAborted) {
  let testText = ''
  if (tableName === 'all') {
    testText = '<thead><tr><th style="width:15%" scope="col">Test summary (' + tableNameMap[tableName] + ')</th><th scope="col">Test feedback</th></tr></thead><tbody>'
  } else {
    testText = '<thead><tr><th style="width:15%" scope="col">' + optionalMandatory + ' Test  summary (' + tableNameMap[tableName] + ')</th><th scope="col">Test feedback</th></tr></thead><tbody>'
  }

  testText += '<tr><td class="align-top"><b><tblack>Total:</tblack></b><tblack> ' + testsTotal + '</tblack><br><rh-tag color="green"> Passed </rh-tag></b> <tblack>' + testsPassed + '</tblack> '
  testText += '<input type="checkbox" class="larger-checkbox" id="filter-' + optionalMandatory + '-passed-' + tableName + '" checked onclick="filterTestCasesBasedOnStateHandler(\'' + tableElement + '\',\'' + tableName + '\', \'passed\',\'' + optionalMandatory + '\' )" >'
  testText += '<br><b><rh-tag color="gray"> Skipped </rh-tag></b> <tblack>' + testsSkipped + '</tblack> '
  testText += '<input type="checkbox" class="larger-checkbox" id="filter-' + optionalMandatory + '-skipped-' + tableName + '" checked onclick="filterTestCasesBasedOnStateHandler(\'' + tableElement + '\',\'' + tableName + '\', \'skipped\', \'' + optionalMandatory + '\' )" >'
  testText += '<br><b><rh-tag color="red"> Failed </rh-tag></b> <tblack>' + testsFailed + '</tblack> '
  testText += '<input type="checkbox" class="larger-checkbox" id="filter-' + optionalMandatory + '-failed-' + tableName + '" checked onclick="filterTestCasesBasedOnStateHandler(\'' + tableElement + '\',\'' + tableName + '\', \'failed\', \'' + optionalMandatory + '\' )" >'
  testText += '<br><b><rh-tag color="purple"> Aborted </rh-tag></b> <tblack>' + testsAborted + '</tblack> '
  testText += '<input type="checkbox" class="larger-checkbox" id="filter-' + optionalMandatory + '-aborted-' + tableName + '" checked onclick="filterTestCasesBasedOnStateHandler(\'' + tableElement + '\',\'' + tableName + '\', \'aborted\', \'' + optionalMandatory + '\' )" >'
  testText += '</td><td>'
  testText += '<rh-accordion class="rh-accordion" id="results-accordion">'
  return testText
}

// generates HTML for a single testcase result
function generateTestcaseSingleResultElement (currentTestResult, tableName, id, mandatoryOptional) {
  const ansiUp = new AnsiUp()
  let commonTestTextContent = ''
  // NOTE: we are assuming the test result is determined by the passed/failed state of the first item
  const testStatus = currentTestResult.state
  let buttontype = ''
  if (testStatus === 'passed') {
    buttontype = '<rh-tag color="green">Passed</rh-tag></div>'
  } else if (testStatus === 'skipped') {
    buttontype = '<rh-tag color="gray">Skipped</rh-tag></div>'
  } else if (testStatus === 'aborted') {
    buttontype = '<rh-tag color="purple">Aborted</rh-tag></div>'
  } else {
    buttontype = '<rh-tag color="red">Failed</rh-tag></div>'
    if (mandatoryOptional !== 'Optional' || tableName === 'all') {
      buttontype = '<rh-tag color="red">failed</rh-tag></div>'
    }
  }
  const itemid = 'collapse' + id
  const headingid = 'heading' + id

  commonTestTextContent += '<rh-accordion-header id="' + headingid + '" data-id="' + testStatus + '" data-bs-target="#' +
    itemid + '" aria-expanded="true"><div class=tag-header><h1 class="test-header">' + currentTestResult.testID.id + buttontype + '</h1></div></rh-accordion-header>'
  commonTestTextContent += '<rh-accordion-panel id="' + itemid + '"aria-labelledby="' + headingid + '" data-id="' + testStatus + '">'
  commonTestTextContent += '<div class="table-responsive">'
  commonTestTextContent += '<h1 class="test-section">Results</h1>'
  commonTestTextContent += '<rh-table><table id="myTable-' + currentTestResult.testID.id + '" class="table table-bordered"><thead><tr>'
  commonTestTextContent += '<th>Test Description</th>'
  commonTestTextContent += '<th>Duration</th>'
  commonTestTextContent += '<th>State</th>'
  commonTestTextContent += '</tr></thead><tbody>'

  dayjs.extend(window.dayjs_plugin_duration)
  const duration = dayjs.duration(currentTestResult.duration / 1000000)
  const formattedDuration = duration.format('D[d] H[h] m[m] s[s] SSS[ms]')
  let skippedReason = ''
  if (currentTestResult.state === 'skipped') {
    skippedReason = currentTestResult.skipReason
    if (skippedReason === '') {
      skippedReason = 'Test case skipped by configuration'
    }
    skippedReason = ' ( ' + skippedReason + ' )'
  }
  commonTestTextContent += '<td>' + currentTestResult.catalogInfo.description.replace(/\n/g, '<br>') + '</td>'
  commonTestTextContent += '<td>' + formattedDuration + '</td>'
  commonTestTextContent += '<td><b>' + currentTestResult.state + '</b>' + skippedReason + '</td>'
  commonTestTextContent += '</tbody></table></rh-table></div>'
  const jsonObjNonCompliant = NonCompliantReasonTextToJson(currentTestResult.checkDetails)
  const jsonObjCompliant = CompliantReasonTextToJson(currentTestResult.checkDetails)
  const logOutput = ansiUp.ansi_to_html(currentTestResult.capturedTestOutput).replace(/\n/g, '<br>')

  commonTestTextContent += '<h1 class="test-section">Feedback</h1><label>Write your feedback for ' + currentTestResult.testID.id + ' test case</label>'
  commonTestTextContent += '<textarea style="width: 100%; margin: 0 auto;" rows = "5" id="source-' + tableName + '-' + currentTestResult.testID.id + '" type="text"></textarea>'

  commonTestTextContent += '<h1 class="test-section">Feedback Response</h1><label>Write your feedback response for ' + currentTestResult.testID.id + ' test case</label>'
  commonTestTextContent += '<textarea style="width: 100%; margin: 0 auto;" rows = "5" id="response-' + tableName + '-' + currentTestResult.testID.id + '" type="text"></textarea>'

  commonTestTextContent += '<h1 class="test-section">Non-Compliant objects</h1>'
  commonTestTextContent += createReasonTableAllTypes(jsonObjNonCompliant)
  commonTestTextContent += '<h1 class="test-section">Compliant objects</h1>'
  commonTestTextContent += createReasonTableAllTypes(jsonObjCompliant)

  // Collapsible test output
  commonTestTextContent += '<rh-accordion class="rh-accordion" id="output-accordion">'
  commonTestTextContent += '<rh-accordion-header aria-expanded="true"><h1 class="test-header"> Test Output</h1></rh-accordion-header>'
  commonTestTextContent += '<rh-accordion-panel>'
  commonTestTextContent += '<div style="width: 100%; margin: 0 auto;">' + logOutput + '</div>'
  commonTestTextContent += '</rh-accordion-panel></rh-accordion >'

  // Close main accordion
  commonTestTextContent += '</rh-accordion-panel>'

  return commonTestTextContent
}

// generates HTML for the table specified by tableName. If not table "All" it produces 2 elements, one for mandatory test and one for optional
function fillResults (claimJson, mandatoryTableElement, optionalTableElement, tableName) {
  // sorting according to state
  const sortedClaimJson = Object.entries(claimJson).sort(function (a, b) {
    const stringA = a[1].testID.id + a[1].state
    const stringB = b[1].testID.id + b[1].state
    return stringA.localeCompare(stringB)
  })
  const sortedClaimJsonObj = Object.fromEntries(sortedClaimJson)

  const stats = getTestCaseStats(claimJson, tableName)
  let testContentMandatory = generateTestCasesStatsElement(mandatoryTableElement, tableName, 'mandatory', 'tred', stats.testsTotal, stats.testsPassed, stats.testsSkipped, stats.testsFailed, stats.testsAborted)
  let testContentOptional = generateTestCasesStatsElement(optionalTableElement, tableName, 'optional', 'ty', stats.testsTotal, stats.testsPassedOptional, stats.testsSkippedOptional, stats.testsFailedOptional, stats.testsAbortedOptional)

  let id = 1
  for (const testIdFromSortedClaim in sortedClaimJsonObj) {
    const currentTestResult = claimJson[testIdFromSortedClaim]
    let mandatoryOptional = currentTestResult.categoryClassification.FarEdge

    if (tableName === 'telco') {
      mandatoryOptional = currentTestResult.categoryClassification.Telco
    }
    if (tableName === 'nontelco') {
      mandatoryOptional = currentTestResult.categoryClassification.NonTelco
    }
    if (tableName === 'extended') {
      mandatoryOptional = currentTestResult.categoryClassification.Extended
    }

    id += 1
    const commonTestContent = generateTestcaseSingleResultElement(currentTestResult, tableName, id, mandatoryOptional)
    if (mandatoryOptional === 'Mandatory' || tableName === 'all') {
      testContentMandatory += commonTestContent
    } else {
      testContentOptional += commonTestContent
    }
  }
  testContentMandatory += '</rh-accordion></td></tr></tbody>'
  testContentOptional += '</rh-accordion></td></tr></tbody>'
  $(testContentMandatory).appendTo($(mandatoryTableElement))
  if (tableName !== 'all') {
    $(testContentOptional).appendTo($(optionalTableElement))
  }
}

// render feedbac saved in JSON on HTML page
function fillFeedback (input) {
  for (const key in input) {
    // copy previous data
    const element = document.getElementById(key)
    if (element === null) {
      continue
    }
    element.textContent = element.value
    element.textContent = input[key]
    element.value = input[key]
  }
}

function saveTextAreaContent (key) {
  const selectScenarioComboBox = document.getElementById('selectScenarioComboBox')
  const tableName = selectScenarioComboBox.options[selectScenarioComboBox.selectedIndex].value
  const sourceId = 'source-' + tableName + '-' + key
  console.log(sourceId)
  const data = document.getElementById(sourceId).value
  document.getElementById(sourceId).textContent = data
}

// handler for version check modal
function handleFiles () {
  const fileList = this.files
  if (fileList.length) {
    // We have a file to load
    const fileUploaded = new FileReader()
    fileUploaded.addEventListener('load', e => {
      claimGlobal = JSON.parse(fileUploaded.result)
      renderResultsWithModal()
    })
    fileUploaded.readAsText(fileList[0])
  }
}

// render results, but first check for claim format version
function renderResultsWithModal () {
  const claimVersion = getClaimVersion(claimGlobal.claim.versions)
  const modalBody = document.getElementById('modalBody')
  if (expectedClaimVersion !== claimVersion) {
    $('#staticBackdrop').modal('show')
    modalBody.textContent = 'Unsupported claim format. Expecting: ' + expectedClaimVersion + ' but got: ' + claimVersion
    // Get a reference to the button element
    const myButton = document.getElementById('continueLoadingClaim')

    // Add an event listener to the button
    myButton.addEventListener('click', renderResults)
  } else {
    renderResults()
  }
}

// fetches the claim file on a HTML server
function fetchRenderClaimFile (fileParam) {
  if (fileParam === null) {
    return
  }
  fetch(fileParam)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error, status = ${response.status}`)
      }
      return response.json()
    })
    .then((data) => {
      claimGlobal = data
      renderResultsWithModal()
    })
    .catch((error) => {
      console.log(`Error: ${error.message}`)
    })
}

// fetches the feedback file on a HTML server
function fetchRenderFeedbackFile (fileParam) {
  if (fileParam === null) {
    return
  }
  fetch(fileParam)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error, status = ${response.status}`)
      }
      return response.json()
    })
    .then((data) => {
      feedbackGlobal = data
      renderResultsWithModal()
    })
    .catch((error) => {
      console.log(`Error: ${error.message}`)
    })
}

// render results tab
function renderResults () {
  if (typeof claimGlobal !== 'undefined') {
    // Create treeview from JSON data
    let result = formatForFastTreeview(0, claimGlobal.claim.configurations, [])
    addOrphans(result.objectArray, '#config-table')
    result = formatForFastTreeview(0, claimGlobal.claim.nodes, [])
    addOrphans(result.objectArray, '#nodes-table')
    fillMetadata(claimGlobal.claim.metadata, '#metadata-table')
    fillVersionsElement(claimGlobal.claim.versions, '#versions-table')
    fillResults(claimGlobal.claim.results, '#results-table', '#optional-', 'all')
    fillResults(claimGlobal.claim.results, '#mandatory-far-edge-table', '#optional-far-edge-table', 'faredge')
    fillResults(claimGlobal.claim.results, '#mandatory-telco-table', '#optional-telco-table', 'telco')
    fillResults(claimGlobal.claim.results, '#mandatory-non-telco-table', '#optional-non-telco-table', 'nontelco')
    fillResults(claimGlobal.claim.results, '#mandatory-extended-table', '#optional-extended-table', 'extended')
    if (typeof feedbackGlobal !== 'undefined') {
      fillFeedback(feedbackGlobal)
    }
  }
}

// converts a linked style to a css rules object
function linkToStyle (link) {
  const css = []
  const sheet = link.sheet
  let rules
  try {
    rules = sheet.cssRules || sheet.rules
  } catch (error) {
    console.log(error)
    return null
  }

  for (let i = 0; i < rules.length; ++i) {
    const rule = rules[i]
    if (rules[i].selectorText === '.collapse:not(.show)') {
      continue
    }
    css.push(rule.cssText)
  }
  const style = document.createElement('style')
  style.type = 'text/css'
  style.appendChild(
    document.createTextNode(css.join('\r\n'))
  )
  return style
}

// return static version of the HTML results
function getHtmlResults () {
  let selectScenarioComboBox = document.getElementById('selectScenarioComboBox')

  const doc = document.implementation.createHTMLDocument()
  const head = doc.head
  const body = doc.body

  const script = doc.createElement('script')
  script.type = 'text/javascript'
  script.textContent = `
  function filterTestCasesBasedOnStateHandler(tableId, tableName, state, mandatoryOptional) { // eslint-disable-line no-unused-vars
    const checkBox = document.getElementById('filter-' + mandatoryOptional + '-' + state + '-' + tableName)
    const show = checkBox.checked
    if (show) {
      checkBox.setAttribute('checked', '')
    } else {
      checkBox.removeAttribute('checked')
    }
    const tableIdClean = tableId.replace(/#/g, '')
    const table = document.getElementById(tableIdClean)
    const elements = table.getElementsByTagName('rh-accordion-header')
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      const id = element.getAttribute('data-id')
      if (id === state) {
        if (show === true) {
          element.removeAttribute('hidden')
        } else {
          element.setAttribute('hidden', 'hidden')
        }
      }
    }
    const panelElements = table.getElementsByTagName('rh-accordion-panel')
    for (let i = 0; i < panelElements.length; i++) {
      const element = panelElements[i]
      const id = element.getAttribute('data-id')
      if (id === state) {
        if (show === true) {
          element.removeAttribute('hidden')
        } else {
          element.setAttribute('hidden', 'hidden')
        }
      }
    }
  }
`

  const scriptElement = document.createElement('script')
  scriptElement.type = 'importmap'
  scriptElement.textContent = ` {
      "imports": {
        "@rhds/elements/": "https://ga.jspm.io/npm:@rhds/elements@1.2.0/elements/",
        "@rhds/elements/lib/": "https://ga.jspm.io/npm:@rhds/elements@1.2.0/elements/lib/",
        "@patternfly/elements/": "https://ga.jspm.io/npm:@patternfly/elements@2.4.0/"
      },
      "scopes": {
        "https://ga.jspm.io/": {
          "@lit/reactive-element": "https://ga.jspm.io/npm:@lit/reactive-element@1.6.3/reactive-element.js",
          "@lit/reactive-element/decorators/": "https://ga.jspm.io/npm:@lit/reactive-element@1.6.3/decorators/",
          "@patternfly/elements/": "https://ga.jspm.io/npm:@patternfly/elements@2.4.0/",
          "@patternfly/pfe-core": "https://ga.jspm.io/npm:@patternfly/pfe-core@2.4.1/core.js",
          "@patternfly/pfe-core/": "https://ga.jspm.io/npm:@patternfly/pfe-core@2.4.1/",
          "@rhds/tokens/media.js": "https://ga.jspm.io/npm:@rhds/tokens@1.1.2/js/media.js",
          "lit": "https://ga.jspm.io/npm:lit@2.8.0/index.js",
          "lit-element/lit-element.js": "https://ga.jspm.io/npm:lit-element@3.3.3/lit-element.js",
          "lit-html": "https://ga.jspm.io/npm:lit-html@2.8.0/lit-html.js",
          "lit-html/": "https://ga.jspm.io/npm:lit-html@2.8.0/",
          "lit/": "https://ga.jspm.io/npm:lit@2.8.0/",
          "tslib": "https://ga.jspm.io/npm:tslib@2.6.2/tslib.es6.mjs"
        },
        "https://ga.jspm.io/npm:@patternfly/elements@2.4.0/": {
          "lit": "https://ga.jspm.io/npm:lit@2.6.1/index.js",
          "lit/": "https://ga.jspm.io/npm:lit@2.6.1/"
        }
      }
    }
`
  doc.head.appendChild(scriptElement)
  doc.head.appendChild(script)
  const sElement = document.createElement('script')
  sElement.type = 'module'
  sElement.textContent = ` 
  // import design system element definitions,
  // which auto-register their tagnames once executed
  import '@rhds/elements/rh-button/rh-button.js';
  import '@rhds/elements/rh-dialog/rh-dialog.js';
  import '@rhds/elements/rh-footer/rh-footer-universal.js';
  import '@rhds/elements/rh-footer/rh-footer-universal.js';
  import '@patternfly/elements/pf-text-input/pf-text-input.js';
  import '@rhds/elements/rh-tabs/rh-tabs.js';
  import '@rhds/elements/rh-accordion/rh-accordion.js';
  import 'https://jspm.dev/@rhds/elements/rh-tag/rh-tag.js'
  </script>
`

  doc.head.appendChild(sElement)

  selectScenarioComboBox = document.getElementById('selectScenarioComboBox')
  insertResults(body, 'mandatory')
  if (selectScenarioComboBox.value !== 'all') {
    insertResults(body, 'optional')
  }

  document.querySelectorAll("link[rel='stylesheet']").forEach(function (link) {
    const style = linkToStyle(link)
    if (style !== null) {
      head.insertBefore(style, head.firstChild)
    }
  })
  document.querySelectorAll('style').forEach(function (style) {
    const clonedStyle = style.cloneNode(true)
    head.insertBefore(clonedStyle, head.firstChild)
  })

  // Make document read-only
  const textareas = doc.querySelectorAll('textarea')

  textareas.forEach(textarea => {
    textarea.readOnly = true
  })

  return doc.documentElement.outerHTML
}

function downloadjsonHandler () { // eslint-disable-line no-unused-vars
  const dict = {}
  const tablesName = ['all', 'telco', 'nontelco', 'extended', 'faredge'] // to go over all the feedback and save it
  for (const key in claimGlobal.claim.results) {
    for (let i = 0; i < tablesName.length; i++) {
      const keydict = 'source-' + tablesName[i] + '-' + key
      const data = document.getElementById(keydict)
      if (data !== null) {
        dict[keydict] = data.value
      }
      // Also save feedback responses
      const responseKeydict = 'response-' + tablesName[i] + '-' + key
      const responseData = document.getElementById(responseKeydict)
      if (responseData !== null) {
        dict[responseKeydict] = responseData.value
      }
    }
  }

  const pom = document.createElement('a')
  pom.setAttribute('href', 'data:text/json;charset=utf-8,' +

    encodeURIComponent(JSON.stringify(dict)))
  pom.setAttribute('download', 'feedback.json')
  pom.style.display = 'none'
  document.body.appendChild(pom)
  pom.click()
  document.body.removeChild(pom)
}

// makes a static copy of test results
function download () { // eslint-disable-line no-unused-vars
  // safeguards all feedback by copying value into textarea text
  for (const key in claimGlobal.claim.results) {
    saveTextAreaContent(key)
  }

  const pom = document.createElement('a')
  pom.setAttribute('href', 'data:text/html;charset=UTF-8,' + encodeURIComponent(getHtmlResults()))
  pom.setAttribute('download', 'results-feedback')

  pom.style.display = 'none'
  document.body.appendChild(pom)

  pom.click()

  document.body.removeChild(pom)
}

// insert a copy of the selected scenario's results
function insertResults (body, optionalMandatory) {
  const checkBox = document.getElementById(optionalMandatory + '-checkbox')
  const selectScenarioComboBox = document.getElementById('selectScenarioComboBox')
  const selectedValue = selectScenarioComboBox.value
  let table = document.getElementById('results-table')
  if (selectedValue === 'faredge') {
    if (checkBox.checked === true) {
      table = document.getElementById(optionalMandatory + '-far-edge-table')
    }
  }
  if (selectedValue === 'telco') {
    if (checkBox.checked === true) {
      table = document.getElementById(optionalMandatory + '-telco-table')
    }
  }
  if (selectedValue === 'nontelco') {
    if (checkBox.checked === true) {
      table = document.getElementById(optionalMandatory + '-non-telco-table')
    }
  }
  if (selectedValue === 'extended') {
    if (checkBox.checked === true) {
      table = document.getElementById(optionalMandatory + '-extended-table')
    }
  }
  const clonedTable = table.cloneNode(true)
  body.appendChild(clonedTable)
}

// extract non-compliant json text from test output with regex
function NonCompliantReasonTextToJson (reasonText) {
  const regex = /NonCompliantObjectsOut":(\[.*])/
  const match = regex.exec(reasonText)
  let jsonObj
  if (match) {
    const jsonStr = match[1]
    jsonObj = JSON.parse(jsonStr)
  }
  return jsonObj
}

// extract compliant json text from test output with regex
function CompliantReasonTextToJson (reasonText) {
  const regex = /"CompliantObjectsOut":(\[.*]),"NonCompliantObjectsOut"/
  const match = regex.exec(reasonText)
  let jsonObj
  if (match) {
    const jsonStr = match[1]
    jsonObj = JSON.parse(jsonStr)
  }
  return jsonObj
}

// create a list of object types present in json output
function createTypeList (jsonData) {
  const objectTypes = new Map()
  if (typeof jsonData === 'undefined') {
    return objectTypes
  }
  jsonData.forEach(function (item) {
    objectTypes.set(item.ObjectType, true)
  })
  return objectTypes
}

// parse json text and creates one HTML table per type
function createReasonTableAllTypes (jsonData) {
  const aTypeMap = createTypeList(jsonData)
  let allTables = ''
  aTypeMap.forEach(function (value, key) {
    allTables += '<h3 class="test-subsection"> Type: ' + key + '</h3>'
    allTables += '<div class="table-responsive">'
    allTables += createReasonTableOneType(jsonData, key)
    allTables += '</div>'
  })
  return allTables
}

// parse json text and creates one HTML table for given type
function createReasonTableOneType (jsonData, aType) {
  if (typeof jsonData === 'undefined') {
    return ''
  }
  // Create table element
  const table = document.createElement('table')
  table.setAttribute('border', '1')
  table.setAttribute('class', 'table table-striped')
  let firstItem = true
  // Create table body
  const tbody = document.createElement('tbody')
  jsonData.forEach(function (item) {
    // if not right type exit
    if (item.ObjectType !== aType) {
      return
    }
    if (firstItem) {
      // Create table header
      const thead = document.createElement('thead')
      const headerRow = document.createElement('tr')
      if (item.ObjectFieldsKeys !== null) {
        Object.values(item.ObjectFieldsKeys).forEach(function (key) {
          const th = document.createElement('th')
          th.textContent = key
          headerRow.appendChild(th)
        })
      }
      thead.appendChild(headerRow)
      table.appendChild(thead)
      firstItem = false
    }
    const row = document.createElement('tr')
    if (item.ObjectFieldsValues !== null) {
      Object.values(item.ObjectFieldsValues).forEach(function (value) {
        const cell = document.createElement('td')
        cell.textContent = value
        row.appendChild(cell)
      })
    }
    tbody.appendChild(row)
  })
  table.appendChild(tbody)
  return table.outerHTML
}

function isStringInt (str) {
  return /^\d+$/.test(str)
}

// Recursive function for displaying a tree of configuration objects
function formatForFastTreeview (parentKey, data, arr) {
  let objectName = ''
  let objectNamespace = ''
  for (const key in data) {
    if (data[key] === null || key === 'managedFields') {
      continue
    }
    if (key.toLowerCase() === 'name') {
      objectName = data[key]
    }
    if (key.toLowerCase() === 'namespace') {
      objectNamespace = data[key]
    }
    const objectID = uuidNode++
    if (Array.isArray(data[key]) || data[key].toString() === '[object Object]') {
      // when data[key] is an array or object

      const result = formatForFastTreeview(objectID, data[key], arr)
      const childName = result.name
      const childNamespace = result.namespace
      if (childName !== '' && childNamespace !== '') {
        objectName = childName
        objectNamespace = childNamespace
      }
      let nameToPush = key
      if (isStringInt(key) && objectName !== '') {
        nameToPush = 'ns:' + objectNamespace + ' name:' + objectName
        objectName = ''
        objectNamespace = ''
      }

      arr.push({
        id: objectID.toString(),
        name: nameToPush,
        parent: parentKey.toString()
      })
    } else {
      // when data[key] is just strings or integer values
      arr.push({
        id: objectID.toString(),
        name: key + ' : ' + data[key],
        parent: parentKey.toString()
      })
    }
  }
  return { objectArray: arr, name: objectName, namespace: objectNamespace }
}

// return true if this treeview object does not have a parent (orphan)
function orphans (data) {
  return data.filter(function (item) {
    return item.parent === '0'
  })
}

// returns true if an item has children
function hasChildren (data, parentId) {
  return data.some(function (item) {
    return item.parent === parentId
  })
}

// Gets children items
function getChildren (data, parentId) {
  return data.filter(function (item) {
    return item.parent === parentId
  })
}

// generates a single list item
function generateListItem (data, item) {
  const li = document.createElement('li')
  li.id = 'item-' + item.id
  if (hasChildren(data, item.id)) {
    const a = document.createElement('a')
    a.href = '#'
    a.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16" part="svg"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"></path>
    </svg>`
    a.title = 'hold shift to expand sub tree'
    a.addEventListener('click', expand.bind(null, data), { once: true })
    a.classList.add('plus')
    li.appendChild(a)
  }
  const span = document.createElement('span')
  span.textContent = item.name
  li.appendChild(span)
  return li
}

// event listener to support expanding children items on click
function expand (data, event) {
  event.preventDefault()
  event.stopPropagation()
  const et = event.target
  const parent = et.parentElement
  const id = parent.id.replace('item-', '')
  const kids = getChildren(data, id)
  const items = kids.map(generateListItem.bind(null, data))
  const ul = document.createElement('ul')
  items.forEach(function (li) {
    ul.appendChild(li)
  })
  parent.appendChild(ul)
  et.classList.remove('plus')
  et.classList.add('minus')
  et.innerHTML = `    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16" part="svg">
  <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"></path>
</svg>`
  et.addEventListener('click', collapse.bind(null, data), { once: true })

  if (event.shiftKey) {
    const max = countChildren(data, id, 0)
    console.log(max)
    initProgressBar()
    expandAll({ value: ul }, max, { value: 2 })
  }
}

// event listener for collapsing items
function collapse (data, event) {
  event.preventDefault()
  event.stopPropagation()
  const et = event.target
  const parent = et.parentElement
  const ul = parent.querySelector('ul')
  parent.removeChild(ul)
  et.classList.remove('minus')
  et.classList.add('plus')
  et.addEventListener('click', expand.bind(null, data), { once: true })
}

// create top level HTML object for tree view (e.g. all the parent-less/orphan objects )
function addOrphans (data, rootObject) {
  const root = document.querySelector(rootObject)
  const orphansArray = orphans(data)
  if (orphansArray.length) {
    const items = orphansArray.map(generateListItem.bind(null, data))
    const ul = document.createElement('ul')
    items.forEach(function (li) {
      ul.appendChild(li)
    })
    root.appendChild(ul)
  }
}

// recursive function to expand all the tree view items starting from one item
function expandAll (obj, max, count) {
  if (isAnchorElement(obj.value)) {
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    })
    obj.value.dispatchEvent(clickEvent)
  }
  count.value++
  const percent = count.value * 100 / max
  updateProgressBar(percent)
  // Check if the object has children
  if (obj.value.children.length > 0) {
    // Iterate through the children and recursively process each child
    setTimeout(function () {
      for (let i = 0; i < obj.value.children.length; i++) {
        const child = obj.value.children[i]
        expandAll({ value: child }, max, count)
      }
    }, 0)
  }
}
// check if the object is a html link
function isAnchorElement (obj) {
  return obj instanceof HTMLAnchorElement
}

// recursive function to count the number of tree view items, under an items (its children). This is used to compute the 100% value of the progress bar
function countChildren (data, id, count) {
  const kids = getChildren(data, id)
  count++
  if (kids.length > 0) {
    count += 2
  }
  kids.forEach(function (kid) {
    count = countChildren(data, kid.id, count) + 1
  })
  return count
}

// update the progress bar to a value
function updateProgressBar (value) {
  const progressBar = document.querySelector('.progress-bar')
  const strippedStr = progressBar.style.width.replace(/%/g, '')
  const currentValue = parseInt(strippedStr)
  if (value >= currentValue + 2) {
    progressBar.style.width = value.toString() + '%'
  }
}

// Initialize the progress bar to 0%
function initProgressBar () {
  document.getElementById('progress-bar').removeAttribute('hidden')
  const progressBar = document.querySelector('.progress-bar')
  progressBar.style.width = '0%'
}
