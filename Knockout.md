Knockout Binding Handler
---------------

Main features:
====
Using typeahead is a breze with knockout driven pages.
The binding handler makes it so  much simpler task to hookup typeahead to input box.

Two-way data binding to viewmodel eliminates the need of setting up and manipulating event handlers for the control.  Instead knockout subscription can be used to customize what to do when the selected typeahead datum changes.

The handler takes care of the task of generating the datum objects the typeahead control uses.  Instead the user simply specifies options on how to map data columns to datum objects.

The handler is also able to interpret simplified syntax of the typeahead options


First thins first - data for the suggestions:
====
The typeahead control relies on list of available options.  This can be both preset-data using the Prefetch or local options and/or remote data, fetched on demand from server when user enters characters in the typeahead control.
In both cases the data has to be groomed in format the typeahead control will understand.   
The minimum requirement is one value field.  
More advanced options require specification of unique key, display name, search phrases and optional fields to be available for the item template for each option.
The binding handler assumes that the underlying list to be bound to is an array of objects (like Json results) or Knockout Observable Array.
Binding handler options are then used to specify how to pick up columns from this array into the typeahead `Datum` structure.

Example 1, as simple as you can:
=====
Lets say we have in our viewmodel list of special countries:

    var countryList = [
      {code: 'IS', name: 'Iceland', localName: 'Ísland'},
      {code: 'GB', name: 'Great Britain', localName: ''},
      {code: 'US', name: 'USA', localName: ''},
      {code: 'AE', name: 'UNITED ARAB EMIRATES', localName: 'دولة الإمارات العربية المتحدة'},
      {code: 'IE', name: 'IRELAND', localName: 'Éire'},
      {code: 'IL', name: 'ISRAEL', localName: 'מְדִינַת יִשְׂרָאֵל'},
      {code: 'IM', name: 'ISLE OF MAN', localName: 'Ellan Vannin'},
      {code: 'IQ', name: 'BRITISH INDIAN OCEAN TERRITORY', localName: 'Chagos Islands'},
      {code: 'JP', name: 'JAPAN', localName: ''}
    ];
This list is on typical JavaScript/Json form.  However the data binder is also able to interpret data on knockoutObservable form (knockoutObservable and knockoutObservableArray). 

This data would typically be stored in or made accessible by javascript viewmodel bound to the html layout.  
    
    var vm = (function () {
    var selectedCountry = ko.observable(); //The selecte country object
    var selectedText = ko.observable();  //The text entered in the control
    var countryList = [
        Our countries...
    ];
    var vm = { 
       selectedCountry: selectedCountry,
       selectedText: selectedText
       countryList: countryList,
    };
    return vm;
    })();
    ko.applyBindings(vm);
    
Let's say we want to take the simple road first: just allow typeahead of the names (since we know they are unique).

Here we can choose between the options on using data binds or events to handle the data data updates to or from the model.  The usual approach would be to data bind the **selectedCountry** and possibly the **selectedText** to the typeahead control. 
However if we want to grab the events from the control we can do it like this:  
  `<input id="country1" type="text" data-bind="typeahead: {local: vm.countryList, valueKey: 'name', onSelected: vm.onCountrySelected, onAutoCompleted: vm.onCountryAutoCompleted}">`

Then the event handlers in the model could look something like this:
    
    function onCountrySelected(e, data) {
        vm.selectedCountry(data);
        alert('Country selected: ' + (vm.selectedCountry() ? vm.selectedCountry().name : 'null'));
    }

Still there is no need to set-up events and manipulate the data.  Simple data binding will do:  
    

Note that the event handler will return the original record, not the actual `Datum` record that was generated behind the scenes for the typeahead control. 
Here we can 
See this this example in action on [Plunker](http://plnkr.co/edit/dg8oYI?p=preview)

Example2, add inn the groovy stuff:
=======
Now we want to do some heavy lifting with the country data we have:   
**1)** The suggestions are to be able to look up countries by Code, Name and Local name   
**2)** We want to display the local name and code in the suggestion dropdown.   
**3)** Let's throw in country flag icons to make it pretty.  
**4)** We want the list to be pre-initialized on Iceland.  
**5)** We will only accept countries that exist in the country list: text must match the selected country name.  

## 1) Lookup field names  
To specify the lookup names we add comma separated option `tokenFields` containing the 3 columns we want to be able to lookup by:
`tokenFields: 'name,code,localName'`
## 2) Value field names
To be able to display the local name in template we better make it a part of the Datum. To do that the binder has the option `valueFields`. Since we intend to use the code as a key it will automatically be put into the datum. So the only field we need to add to the datum by this method is the localName field.
`valueFields: 'localName'`
## 3) Item template set-up
Add the icons to the site and name them by the code: IS,GB,US,AE,IE,IL,IM,IQ and JP.
Then we want to think about the item template: 
Of course we can include the template text in the binding handler `template` option: like this:
template: `<p>{{name}} ({{code}})</p>`
or data bind it to viewmodel:
`template: vm.templaText`  
However if we want fancy layout with a lot of html code it is rather ugly to put it directly into to the options.
Also receiving the template layout from the viewmodel is not good practice since we should separate the layout from the logic.
So what would be more appropriate than to include the template layout section in the html as a hidden element. To make sure it is not rendered, i.e. the image element, we put this all into a script element.  
    
    <script id="OurID" type="text/template" class="template">
     <div class="row">
      <img class="pull-left" style="margin-right: 5px;" src="/Content/country24/{{code}}.png"</img>
      <p class="pull-left">{{name}} ({{code}})</p>
      <p class="pull-right" style="margin-right: 5px;">{{localName}}</p>
     </div>
    </script>
    
Then let the binding handler option point to the element containing the template:
`templateElement: '#OurIDe'`
Note: to include the hash `#` as this since this option is supposed to contain JQuery locator token.
This example uses the `Hogan` template engine. By default the handler assumes the template engine to be Hogan.
## 4) Pre-set selected datum in the typeahead
We can bind the selected datum to our viewmodel as we did showcase in the previous example using the selectedDatum option.
`selectedDatum: vm.selectedCountry`
Remember that vm.selecteCountry is a knockout observable.
The `selectedDatum` option uses two-way binding so to select particular country in code just involves setting the `vm.selectedCountry` value.  
`this.vm.selectedCountry(vm.countryList[0]);`

## 5) Restrict selection to available data
So in case we only want to accept countries in our list, the typeahead will allow for this using the option `restrictInputToDatum`.  
`restrictInputToDatum: true`

## The binding example
    
    data-bind="typeahead: { selectedDatum: vm.selectedCountry, local: vm.countryList, valueKey: 'code', nameKey: 'name', tokenFields: 'name,code,localName', valueFields: 'localName', templateElement: '#countryItemTemplate', restrictInputToDatum: true }"
    
See example2 in action on [Plunker](http://plnkr.co/edit/QaRp2m?p=preview)

Example 3, prefetch:
=====
## 1) Synchronous prefetch example
This example shows how to use pefetchHandler to load prefetched data by our own internal function and thus in perfect control of the prefetch data.
We can omit the prefetch options and just set the handler function as the prefetch option like this, if we do not require extra options like ttl or cacheKey.
    
    data-bind="value: vm.selectedText1, typeahead: { selectedDatum: vm.selectedCountry1, prefetch: vm.handlerSync, valueKey: 'code', nameKey: 'name', tokenFields: 'name,code,localName', valueFields: 'localName', templateElement: '#countryItemTemplate'}"

We bind the selected text from the control by normal knockout valueabinding to `selectedText1` in the viewmodel
In case user picks something in the autocomplete we get the original data to the viewmodels `selectedCountry` using the `selectedDatum` option. If we are handling synchronous fetch, (do not have to wait for remote response) we do not have to wrap the result in promise, just return the data  
**Handler function in viewmodel:**
    
    function handlerSync() {
    var data = [];
    countryList.forEach(function (itm) { data.push(itm); });
    return data;
    }
## 2) Asynchronous prefetch example
The next typeahead control demonstrates asynchronous prefetch.
    
    data-bind="value: vm.selectedText2, typeahead: {selectedDatum: vm.selectedCountry2, minLength: 0, isBusy: vm.isInProgress, prefetch: vm.handlerAssSync, valueKey: 'code', nameKey: 'name', tokenFields: 'name,code,localName', valueFields: 'localName', templateElement: '#countryItemTemplate'}"
Note that this one is configured to show all available options when focused `minLength: 0`.
Also we bind busy indicator `vm.isInProgress` to the knockout binding option `isBusy`. This means that `busyUpdate` events from the typeahead control are catched by the knockout binding handler and used for updating the bound knockout variable, yet again bound to the visible property of the progress indicator.
The assync handler function in the viewmodel for this case looks like this:
	
	function handlerAsSync() {
        var data = [];
        var def = $.Deferred(); 
        function onTimeout() {
          def.resolve(data); 
        }
        countryList.forEach(function (itm) { data.push(itm); });
        setTimeout(onTimeout,3000); 
        return def;
    }
Above we use `setTimeout()` to delay the execution so we can see a progress indicator fire off (when the prefetched data is not fetched from the cache). 
In the Plunker demo referenced below you see two buttons that demonstrate the `clearCache` and the `refresh` methods of typeahead.
Another new feature of this typeahead version is that you no longer need to initialize pre-set values using the `setQuery` method.
While the input control is initializing you can start to type in text and the suggestions will update automatically once the prefetched suggestion data is ready.
See this example in action on [Plunker](http://plnkr.co/edit/56nDoL?p=preview)


## Compatibility to the official typeahead.js

<b>Note that at his moment, the binder [typeaheadKoBinding.js](dist/typeaheadKoBinding.js>) will not work with the official typeahead.js version, you have to use the accompanying version: [typeahead.js](dist/typeahead.js)</b>.  The main reason is that the official does not include many of the features provided here.  Also at this moment the official (v9.3) also contains critical bugs. See the [typeahead issue list](https://github.com/twitter/typeahead.js/issues?state=open) for details on that. 

## Knockout binder reference

**See the [reference manual](KnockoutRef.md) for the binding handler.**

## JQuery examples
**You will also find the equivilent [JQuery examples here](Examples.md)**
