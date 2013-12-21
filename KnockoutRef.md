Knockout Binding Handler Reference
---------------

Install:
====
Copy the javascript s [typeaheadKoBinding.js](dist/typeaheadKoBinding.js>)
 and  [typeahead.js](dist/typeahead.js) to your scripts directory.  
Include the link reference to the scripts in you html file.  Place the scripts after your knockout line, in this order:  typeahead.js, typeaheadKoBinding.js  
[See the knockout website, for details on knockout installation](http://knockoutjs.com/downloads/index.html)

Compatibility to the official typeahead.js
====
<b>Note that at his moment, the binder [typeaheadKoBinding.js](dist/typeaheadKoBinding.js>) will not work with the official typeahead.js version, you have to use the accompanying version: [typeahead.js](dist/typeahead.js)</b>.  The main reason is that the official does not include many of the features provided here.  Also at this moment the official also contains critical bugs. See the [typeahead issue list](https://github.com/twitter/typeahead.js/issues?state=open) for details on that.  However this version is fully backward compatible with the official version so you should not loose any functionality with your previous modifications if you replace your version of typeahead.js with this one. If you do, please report it at my [typeahead fork](https://github.com/Svakinn/typeahead.js/issues)

Data bind
======
There are two values you can data bind to your viewmodel:
# 1) the input value
Here you use the normal Knockout value data binding:
    
    <input data-bind="value: vm.myText, typeahead: {.. the rest of the options..}">

   The data type in your viewmodel should be knockoutObservable() on text item.
# 2) the selected datum
The selected datum is the object that includes the data in the underlying options list that is currently selected.  When nothing is selected the value will be null.  When you have selected item in the typeahead by 'autocompletion' or by 'selection' the value of your binding will be the underlying record you used for the typeahead dataset (local,remote,prefetch).
    
    <input data-bind="tyepahead: {selectedDatum: vm.myDatum, .... the rest of the options......}">
# 2) The suggestion source
This can be any of following: `local`, `remote` or `prefetch`. 
In fact you can use any or all of them simultaneously and some of them more than once.  
The typeahaead control requires the remote and prefetch options to have their own options.

**Example:**
    
    local: localdata, remote: {name: 'remote1', url: 'myurl' datatype: 'json'}, prefetch: {name: 'pref', url: 'myurl2', datatype: 'json'}
    
This handler supports this format but also offers the remote and prefetch options to be defined globally.  This works as long as you do not have many instances with different settings.

**Examples:** 
    
    local: localdata, url: 'myurl', datatype: 'json'
    
The reason the databinder allows this is to make it as simple as possible for user to set-up simple settings. If more complications are required, you can always revert to the original format.

[See the knockout reference for details](Readme.md)


#Eeeeeee  More to  come soon..
