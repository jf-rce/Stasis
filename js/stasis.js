//Globals
var _rowCount;
var _accounts; 

//Class and enum definitions
var ValidationError = {
  
  None : 0,
  SymbolQuote: 1 << 0,
  SharesValue: 1 << 1, 
  TargetPercentageInvalid: 1 << 2,
  TargetPercentageSum: 1 << 3,
  Contributions: 1 << 4
  
}

var VmmxxImportOptions = {
 
    Contribution : "contribution",
    Holding : "holding",
    Exclude : "exclude"
    
}

var Account = function(accountNumber){
        
    this.accountNumber = accountNumber;
    this.holdings = [];
    this.excludedHoldings = [];

}

var Holding = function(investmentName, symbol, shares, quote){
    
    this.investmentName = investmentName;
    this.symbol = symbol;
    this.shares = shares;
    this.quote = quote;
    
}

//Functions
$(window).load(function () {
  
  init();
  
});

function init(){
  
  
  $("#btnAddRow").click(function(){
    addRow();
  });  
  
  $("#btnCalculate").click(function(){
    
    onCalculate();    

  });
  
  $("#btnModalSubmitFile").click(function(){
    
    importModalSubmitFile(); 

  });
  
  $("#btnModalSubmitOptions").click(function(){
    
    importModalSubmitOptions(); 

  });
  
  $("#btnModalCloseExcludedHoldings").click(function(){
    
    handleExcludedHoldingsCookie();

  });
  
  
  $('#contributions').focusout(function(){
    
    var input = $(this);
    
    contributionsFocusOut(input, input.val());
    
  });
  
  
  $('input:radio[name="vmmxx"]').change(function(){
        if ($(this).is(':checked') && $(this).val() == 'exclude') {
            $('#dropdownVmmxx').prop('disabled', true);
            
        }
        else{
            $('#dropdownVmmxx').removeAttr('disabled'); 
        }
   });
   
  
  for(var i = 0; i < 4; i++){
    addRow();
  } 
  
}

function attachRowListeners(){
    $(".symbol").each(function() {
     
     var input = $(this);
     
     input.focusout(input, function(){
       fetchQuote(input, input.val());
       
     });
      
  });
  
  $(".shares").each(function(){
    var input = $(this);
    
    input.focusout(input, function(){
       sharesFocusOut(input, input.val());
       
     });
  });
  
  
  $(".targetPercentage").each(function(){
    var input = $(this);
    
    input.focusout(input, function(){
      
              
        targetPercentageFocusOut(input, input.val());
       
     });
  });
  
  $(".btnRemoveRow").each(function(){
    var button = $(this);
    
    button.unbind().click(function(){
      
      removeRow(button);
      
    });
    
    
  });
  
  
}

//fetches a stock quote from Yahoo Finance
function fetchQuote(symbolInput, symbol) {
  
  //show loading icon
  if(symbol != null && !(symbol === "")){
    
    

      symbolInput.parent().parent().children().each(function() {
        
        
        var loadingImgs = $(this).children(".loading");
        if(loadingImgs.length > 0){
          
          $(loadingImgs[0]).attr('class', 'loading visible');
          
        } 
        
        var quoteSpans = $(this).children(".quote");
        if(quoteSpans.length > 0){
    
            
            symbolInput.attr('class', 'symbol');
            quoteSpans[0].textContent = "";
          
        } 
          
      });
  
  
    var url = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22' + symbol + '%22)%0A%09%09&env=http%3A%2F%2Fdatatables.org%2Falltables.env&format=json'
    $.getJSON(url, function(data){
      
      var quote = data.query.results.quote.LastTradePriceOnly;
      var quoteSpans;
      var sharesInputs;
      var valueSpans;
      var loadingImgs;
      symbolInput.parent().parent().children().each(function() {
        
        if($(this).children(".quote").length > 0){
          quoteSpans = $(this).children(".quote");
          
        }
        if($(this).children('.shares').length > 0){
          sharesInputs = $(this).children('.shares');

        }
        
        if($(this).children(".value").length > 0){
          
          valueSpans = $(this).children(".value");
        }
        
        if($(this).children(".loading").length > 0){
          loadingImgs = $(this).children(".loading");
        }

        
      });
      
      if(quoteSpans.length > 0 && sharesInputs.length > 0 && valueSpans.length > 0){
          
          if(quote == null){
            
            symbolInput.attr('class', 'symbol error');
            quoteSpans[0].textContent = "";
          }
          else{
          
            symbolInput.attr('class', 'symbol');
            quoteSpans[0].textContent = quote;
            var shares = $(sharesInputs[0]).val();
            if(!(shares === "") && $.isNumeric(parseFloat(shares))){
              valueSpans[0].textContent = (parseFloat(shares) * parseFloat(quote)).toFixed(2);
            }
            
          }
          
      } 

      if(loadingImgs.length > 0){
        
        $(loadingImgs[0]).attr('class', 'loading hidden');
        
      } 
      

    });
    
  }
  
  if(symbol === ""){
    
    var rowId = parseInt(symbolInput.parent().parent().attr('id')) - 1;
    
    symbolInput.attr('class', 'symbol');
    
    var quoteSpan = $('.quote')[rowId];
    var valueSpan = $('.value')[rowId];
    
    quoteSpan.textContent = "";
    valueSpan.textContent = "";

    
  }

}

function addRow() {
  
  _rowCount = (_rowCount == null) ? 1 : _rowCount + 1;
  
  $('#tableBody').append('<tr id=\"' + _rowCount.toString() + '\"><td><button class=\"btnRemoveRow\">-</button></td><td><input type=\"text\" class=\"symbol\"></td><td><input type=\"text\" class=\"shares\"></td><td><span class=\"quote\"></span><img class=\"loading hidden\" src=\"images/loading.gif\" alt=\"loading\" width=\"16\" height=\"16\"></td><td><span class=\"value\"></span></td><td><input type=\"text\" class=\"targetPercentage\"></td><td><span class=\"targetShares\"></span></td><td><span class=\"targetValue\"></span></td><td><span class=\"difference\"></span></td></tr>');
  
  attachRowListeners();
  
  
  
}

function removeRow(button){
  
  //1-based index!!
  var tr = button.parent().parent();
  var rowIndex = parseInt(tr.attr('id'));
  tr.remove();

  //loop over rows with higher indeces and decrement id values
  for(var i = rowIndex + 1; i <= _rowCount; i++){

      $('#' + i.toString()).attr('id', (i -1).toString());

  }
  
  _rowCount--;
 
}

function sharesFocusOut(sender, value){
  
  if(value === ""){
    

    var rowId = parseInt(sender.parent().parent().attr('id')) - 1;
    
    sender.attr('class', 'shares');
    
    var valueSpan = $('.value')[rowId];
    valueSpan.textContent = "";
    
    return;
    
  }
  
  var quote;
  
  if($.isNumeric(value)){
    sender.attr('class', 'shares');
    
    sender.parent().parent().children().each(function() {
      
      var quoteSpans = $(this).children(".quote");
      
      if(quoteSpans.length > 0){
        
        if(quoteSpans[0].textContent != ""){
          quote = quoteSpans[0].textContent;
          
        }        
      }
     });


    sender.parent().parent().children().each(function() {
      var valueSpans = $(this).children(".value");
      if(valueSpans.length > 0 && quote != null){
  
          valueSpans[0].textContent = (value * parseFloat(quote)).toFixed(2);
        
      } 
    });  

  }
  else{
    sender.attr('class', 'shares error');
    
  }
  
  
}

function targetPercentageFocusOut(sender, value){
  
     if("" === value){
       return;
     } 
  
     var val = parseFloat(value);
     
     
      
      
      if($.isNumeric(parseFloat(sender.val()))){
        
        if(val > 100.0){
          //error
          sender.attr('class', 'targetPercentage error');
        
        }
        else{
          sender.attr('class', 'targetPercentage');
        }
        
        }
        else{
          //error
          sender.attr('class', 'targetPercentage error');
        }
  
}

function contributionsFocusOut(sender, value){
  
  if("" === value){
    return;
  }
  
  var val = parseFloat(value);
  
  if($.isNumeric(parseFloat(sender.val()))){
  
    if(val < 0.0){
      //error
      sender.attr('class', 'error');
    
    }
    else{
      sender.attr('class', '');
    }
  
  }
  else{
    //error
    sender.attr('class', 'error');
  }
  
  
}

//validates user input
//returns bitwise result that can be bitwise or'd with ValidationError enum
function validate() {
 
  var ret = 0;
  
  //var symbols = $('.symbol')
  var shares = $('.shares');
  var quotes = $('.quote');
  var values = $('.value');
  var tgtPcts = $('.targetPercentage');
  var contributions = $('#contributions');
  
  
  var tgtPctSum = 0.0;
  
  for(var i = 0; i < _rowCount; i++){
    
    if(quotes[i].textContent === "" || !$.isNumeric(quotes[i].textContent)){

      ret = ret | ValidationError.SymbolQuote;
    }
    
    if(values[i].textContent === "" || !$.isNumeric(values[i].textContent)){

      ret = ret | ValidationError.SharesValue;
    }

    if($(tgtPcts[i]).val() === "" || !$.isNumeric($(tgtPcts[i]).val())){

      ret = ret | ValidationError.TargetPercentageInvalid;
    }
    else{
      tgtPctSum += parseFloat($(tgtPcts[i]).val());
      
    }
    
    if($(shares[i]).val() === "" || !$.isNumeric($(shares[i]).val()) || parseFloat($(shares[i]).val()) < 0.0 ){
      ret = ret | ValidationError.SharesValue;
    }
    
    if(contributions.val() === "" || !$.isNumeric(contributions.val()) || parseFloat(contributions.val()) < 0.0){
      
      ret = ret | ValidationError.Contributions;
      
    }
    
  }
  
  if(tgtPctSum != 100.0){
    
    ret = ret | ValidationError.TargetPercentageSum;
    
  }
   
  return ret;

}

function importModalSubmitFile(){
    
    var fileName = $("#fileInput").val();
    
    var invalidFile = "File is not a Vanguard transaction CSV";
    
    if(fileName){
        
        Papa.parse($("#fileInput")[0].files[0], {
            complete: function(results) {

               if(results.errors.length == 0){
                   
                   var dataLength = results.data.length;
                   
                   if(dataLength > 1 && results.data[0].length == 7){
                       
                       if((results.data[0][0] ===  "Account Number") &&
                          (results.data[0][1] === "Investment Name") &&
                          (results.data[0][2] === "Symbol") &&
                          (results.data[0][3] === "Shares") &&
                          (results.data[0][4] === "Share Price") &&
                          (results.data[0][5] === "Total Value")){
                          
                          
                          _accounts = [];
                          
                          
                          var i = 1;
                          do{
                              
                              if(!isNaN(results.data[i][0]) && !(results.data[i][0] === "")){
                                  
                                  //create the account if it does not already exist in accounts list
                                  var createNew = true;
                                  
                                  for(var j = 0; j < _accounts.length; j++){
                                      if(_accounts[j].accountNumber == parseInt(results.data[i][0])){
                                          createNew = false;
                                      }
                                  }
                                  
                                  if(createNew){
                                      var account = new Account(parseInt(results.data[i][0]));
                                      _accounts.push(account);
                                  }
                                  
                                  //included holding
                                  if(!(results.data[i][2] === "") &&
                                     !isNaN(results.data[i][3]) &&
                                     !isNaN(results.data[i][4])){
                                      
                                      var holding = new Holding(results.data[i][1], 
                                                                results.data[i][2], 
                                                                parseFloat(results.data[i][3]), 
                                                                parseFloat(results.data[i][4]));
                         
                                                                
                                    for(var j = 0; j < _accounts.length; j++){
                                        if(_accounts[j].accountNumber == parseInt(results.data[i][0])){
                                            _accounts[j].holdings.push(holding);
                                        }
                                    }    
                                  }
                                  
                                  //excluded holding (no symbol/shares/value)
                                  if((results.data[i][2] === "") ||
                                     isNaN(results.data[i][3]) ||
                                     isNaN(results.data[i][4])){
                                     
                                     var holding = new Holding(results.data[i][1], 
                                                                results.data[i][2], 
                                                                parseFloat(results.data[i][3]), 
                                                                parseFloat(results.data[i][4]));
                                                                
                                                                
                                    for(var j = 0; j < _accounts.length; j++){
                                        if(_accounts[j].accountNumber == parseInt(results.data[i][0])){
                                            _accounts[j].excludedHoldings.push(holding);
                                        }
                                    }  
                                            
                                         
                                  }

                              }
  
                              i++;
                          }while(i < dataLength && !(results.data[i][0] === "Account Number"))      
                          
                          if(_accounts.length > 0){
                              
                            //switch to options modal  
                            $('#importFileModal').modal('hide');
                            $('#importOptionsModal').modal('show');
                            
                            //clear dropdowns
                            $('#dropdownAccounts').empty();
                            $('#dropdownVmmxx').empty();
                            
                            //add accounts to dropdowns
                            for(var accountIndex = 0; accountIndex < _accounts.length; accountIndex++){
                                
                                var account = _accounts[accountIndex];
                                
                                $('#dropdownAccounts').append('<option value="' + account.accountNumber.toString() + '">' + account.accountNumber.toString() + '</option>');
                                
                                $('#dropdownVmmxx').append('<option value="' + account.accountNumber.toString() + '">' + account.accountNumber.toString() + '</option>');
                            }
                            
                            
                            //add combine all option if more than 1 account
                            if(_accounts.length > 1){
                                $('#dropdownAccounts').prepend('<option value="-1">combine all</option>');
                                $('#dropdownVmmxx').prepend('<option value="-1">combine all</option>');
                            }
                          }
                          else{
                              alert(invalidFile);
                          }   
                      }
                      else{
                          alert(invalidFile);
                      } 
                   }
                   else{ 
                       alert(invalidFile);
                   }
               }
               else{
                   alert("Error parsing file");
               }
            }
        });
    }
    else{
        alert("No file selected");
    }
}

function importModalSubmitOptions(){
    
    
    //hide options modal, clear all rows, set row count to 0
    $('#importOptionsModal').modal('hide');
    $('#tableBody').empty();
    $('#contributions').val('');
    _rowCount = 0;
    
    //import data from _accounts based on options modal settings
    var accountToImport = $('#dropdownAccounts').val();
    var vmmxxToImport = $('#dropdownVmmxx').val();
    var vmmxxOptions = $("input:radio[name ='vmmxx']:checked").val();
    
    var excludedHoldings = [];
    
    
    //holdings
    if(accountToImport == -1){
        
        var uniqueHoldings = [];
            
        for(var i = 0; i < _accounts.length; i++){
            
            //included holdings
            for(var j = 0; j < _accounts[i].holdings.length; j++){

                if(!(_accounts[i].holdings[j].symbol === "VMMXX")){
                    
                    var duplicate = false;
                    var uniqueHoldingIndex = -1;
                    
                    for(var k = 0; k < uniqueHoldings.length; k++){
                        if(_accounts[i].holdings[j].symbol === uniqueHoldings[k].symbol){
                            duplicate = true;
                            uniqueHoldingIndex = k;
                            break;
                        }   
                    }
                    
                    if(duplicate){
                        
                        var shares = parseFloat(uniqueHoldings[uniqueHoldingIndex].shares);
                        shares +=  parseFloat(_accounts[i].holdings[j].shares);
                        uniqueHoldings[uniqueHoldingIndex].shares = shares.toString();
                        
                    }else{
                        
                        uniqueHoldings.push(_accounts[i].holdings[j]);
                    }
                    
                }
            }
            
            //excluded holdings
            for(var j = 0; j <_accounts[i].excludedHoldings.length; j++){
                var duplicate = false;
                
                for(var k = 0; k < excludedHoldings.length; k++){
                    if(excludedHoldings[k].investmentName === _accounts[i].excludedHoldings[j].investmentName){
                        duplicate = true;
                        break;
                    }
                }
                
                if(!duplicate){
                    
                    excludedHoldings.push(_accounts[i].excludedHoldings[j]);
                    
                }
                
            }
            
            
        }
        
        for(var i = 0; i < uniqueHoldings.length; i++){
                        
            addRow();
            var symbols = $('.symbol');
            var shares = $('.shares');
            var quotes = $('.quote');
            var values = $('.value');
            
            $(symbols[_rowCount - 1]).val(uniqueHoldings[i].symbol);
            $(shares[_rowCount - 1]).val(uniqueHoldings[i].shares);
            quotes[_rowCount - 1].textContent = uniqueHoldings[i].quote;
            
            values[_rowCount - 1].textContent = ((parseFloat(uniqueHoldings[i].shares) *
                                            parseFloat(uniqueHoldings[i].quote)).toFixed(2).toString());
            
        }
        
            
    }
    else{
        
        for(var i = 0; i < _accounts.length; i++){

            if(_accounts[i].accountNumber == accountToImport){
                
                //included holdings
                for(var j = 0; j < _accounts[i].holdings.length; j++){
                    
                    
                    if(!(_accounts[i].holdings[j].symbol === "VMMXX")){
                        
                        addRow();
                        
                        var symbols = $('.symbol');
                        var shares = $('.shares');
                        var quotes = $('.quote');
                        var values = $('.value');
                        
                        $(symbols[_rowCount - 1]).val(_accounts[i].holdings[j].symbol);
                        $(shares[_rowCount - 1]).val(_accounts[i].holdings[j].shares);
                        quotes[_rowCount - 1].textContent = _accounts[i].holdings[j].quote;
                        
                        values[_rowCount - 1].textContent = ((parseFloat(_accounts[i].holdings[j].shares) *
                                                     parseFloat(_accounts[i].holdings[j].quote)).toFixed(2).toString());

                    }
                }
                
                
                //excluded holdings
                for(var j = 0; j <_accounts[i].excludedHoldings.length; j++){
                    var duplicate = false;
                    
                    for(var k = 0; k < excludedHoldings.length; k++){
                        if(excludedHoldings[k].investmentName === _accounts[i].excludedHoldings[j].investmentName){
                            duplicate = true;
                            break;
                        }
                    }
                    
                    if(!duplicate){
                        
                        excludedHoldings.push(_accounts[i].excludedHoldings[j]);
                        
                    }
                    
                }
                
            }
        }  
    } 
    
    //VMMXX
    if(!(vmmxxOptions === VmmxxImportOptions.Exclude)){
        
    
        if(vmmxxToImport == -1){
            
            var vmmxxSharesSum = 0.0;
            var vmmxxQuote;
            
            for(var i = 0; i < _accounts.length; i++){
                    
                for(var j = 0; j < _accounts[i].holdings.length; j++){
                    
                    if(_accounts[i].holdings[j].symbol === "VMMXX"){
                            
                        vmmxxQuote = parseFloat(_accounts[i].holdings[j].quote);
                        vmmxxSharesSum += parseFloat(_accounts[i].holdings[j].shares);
                    }
                } 
            }
            
            if(vmmxxOptions === VmmxxImportOptions.Contribution){
            
                $('#contributions').val((vmmxxSharesSum * parseFloat(vmmxxQuote)).toFixed(2).toString());
            
            }
            else if(vmmxxOptions === VmmxxImportOptions.Holding){
                addRow();
                
                var symbols = $('.symbol');
                var shares = $('.shares');
                var quotes = $('.quote');
                var values = $('.value');

                $(symbols[_rowCount - 1]).val("VMMXX");
                $(shares[_rowCount - 1]).val(vmmxxSharesSum.toString());
                quotes[_rowCount - 1].textContent = vmmxxQuote;
                
                values[_rowCount - 1].textContent = (vmmxxSharesSum *
                                            parseFloat(vmmxxQuote)).toFixed(2).toString();

            }
   
        }
        else{
            for(var i = 0; i < _accounts.length; i++){
                
                if(_accounts[i].accountNumber == vmmxxToImport){
                    
                    for(var j = 0; j < _accounts[i].holdings.length; j++){
                        
                        if(_accounts[i].holdings[j].symbol === "VMMXX"){
                                
                            if(vmmxxOptions === VmmxxImportOptions.Contribution){
                            
                                $('#contributions').val((parseFloat(_accounts[i].holdings[j].shares) *
                                                            parseFloat(_accounts[i].holdings[j].quote)).toFixed(2).toString());
                            
                            }
                            else if(vmmxxOptions === VmmxxImportOptions.Holding){
                                addRow();
                            
                                var symbols = $('.symbol');
                                var shares = $('.shares');
                                var quotes = $('.quote');
                                var values = $('.value');
                                
                                $(symbols[_rowCount - 1]).val(_accounts[i].holdings[j].symbol);
                                $(shares[_rowCount - 1]).val(_accounts[i].holdings[j].shares);
                                quotes[_rowCount - 1].textContent = _accounts[i].holdings[j].quote;
                                
                                values[_rowCount - 1].textContent = ((parseFloat(_accounts[i].holdings[j].shares) *
                                                            parseFloat(_accounts[i].holdings[j].quote)).toFixed(2).toString());
                    
                            }
                        }
                    }
                } 
            }
        }
    }
    
    
    if (Cookies.get('stasisShowExcluded') === undefined || Cookies.get('stasisShowExcluded') === null) {
        
        if(excludedHoldings.length > 0){
            $('#excludedModal').modal('show');
                $('#listExcluded').empty();
                
                for(var i = 0; i < excludedHoldings.length; i++){
                    
                    $('#listExcluded').append('<li>' + excludedHoldings[i].investmentName + '</li>');
                }
        }
                
    }
    

    
         
}

function handleExcludedHoldingsCookie(){
    
    $('#excludedModal').modal('hide');
    
    //check value of checkbox and save cookie if necessary
    if($("#checkboxExcluded").is(':checked')){
        
        Cookies.set('stasisShowExcluded', 'true', { expires: 365 });
        
    }
        

}


//calculates target shares, target values, and differences
function calculate(){
  
    var shares = $('.shares');
    var quotes = $('.quote');
    var values = $('.value');
    var tgtPcts = $('.targetPercentage');
    var tgtShares = $('.targetShares');
    var tgtValues = $('.targetValue');
    var differences = $('.difference');
    var contributions = $('#contributions');
    
    var totalAssets = parseFloat(contributions.val());
    
    for(var i = 0; i < _rowCount; i++){
      totalAssets += parseFloat(values[i].textContent);
    }
    
    
    for(var i = 0; i < _rowCount; i++){
      tgtValues[i].textContent = ((parseFloat($(tgtPcts[i]).val()) / 100.0) * totalAssets).toFixed(2).toString();
      
      tgtShares[i].textContent = (parseFloat(tgtValues[i].textContent) / parseFloat(quotes[i].textContent)).toFixed(2).toString();
      
      differences[i].textContent = (parseFloat(tgtShares[i].textContent) - parseFloat($(shares[i]).val())).toFixed(2).toString();
      
    }
    
  
  
}

//event handler for calculate button click
function onCalculate(){
  
  
   var ret = validate();
    
   if(ret == ValidationError.None){
     
     calculate();
     
   }
   else{
     var errorString = "One or more errors occurred: \n\n";
     
     if((ret & ValidationError.SymbolQuote) == ValidationError.SymbolQuote){
       
       errorString += "- One or more rows has an invalid symbol/quote\n"
       
     }
     
     if((ret & ValidationError.SharesValue) == ValidationError.SharesValue){
       
       errorString += "- One or more rows has an invalid shares entry/value.\n"
       
       
     }
     
     if((ret & ValidationError.TargetPercentageInvalid) == ValidationError.TargetPercentageInvalid){
       
       errorString += "- One or more rows has an invalid target percentage.\n"
       
       
     }
     
     if((ret & ValidationError.TargetPercentageSum) == ValidationError.TargetPercentageSum){
       
       errorString += "- The sum of all target percentages does not equal 100.0.\n"
       
       
     }
     
     if((ret & ValidationError.Contributions) == ValidationError.Contributions){
       
       errorString += "- Invalid entry for 'contributions ($)'. Enter '0' if you are looking to rebalance without any new contributions.\n"
       
     }
     
     errorString += "\nPlease fix the above errors and click 'calculate' again.";
     
     alert(errorString);
  
  }
  
}  

