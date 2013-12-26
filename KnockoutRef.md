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
The selected datum is the object that includes the data in the underlying options list that is currently selected.  When nothing is selected the value will be `null`.  When you have selected item in the typeahead by `autocompletion` or by `selection` the value of your binding will be the underlying record you used for the typeahead dataset (local,remote,prefetch).
    
    <input data-bind="tyepahead: {selectedDatum: vm.myDatum, .... the rest of the options......}">
# 2) The suggestion source
This can be any of following: `local`, `remote` or `prefetch`. 
In fact you can use any or all of them simultaneously and some of them more than once.  
The `typeahaead` control requires the `remote` and `prefetch` options to have their own options.

**Example:**
    
    tyepahead: {local: vm.localdata, remote: {name: 'remote1', url: 'myurl' datatype: 'json'}, prefetch: {name: 'pref', url: 'myurl2', datatype: 'json'}}
    
This handler supports this format but also offers the `remote` and `prefetch` options to be defined globally.  This works as long as you do not have many instances with different settings.

**Examples:** 
    
    typeahead: {local: vm.localdata, url: 'myurl', datatype: 'json'}
    
The reason the data binder allows this is to make it as simple as possible for user to set-up simple settings. If more complications are required, you can always revert to the original format.

[See the knockout reference for details](Readme.md)

#Datasets
Typeahead offers the option of having more than one source of suggestion data in each control.
The data binder supports this by accepting array of dataset definitions like this:

    typeahead: [{name='src1', local: vm.localdata1},{name='src2', local: 

In most cases you are working with only one dataset and thus this array vm.localdata2}]wrapping is not needed.

#Binder and the Datum
The typeahead control requires a list of so called `Datum` object to handle available suggestions.  This structure includes unique key for the row and the display name to be used in the input box.  Also the datum includes list of searchable values for the local data query search.  Finally fields needed for the suggestion template should be placed in this object.  
This binding control will handle the process of generating the datum objects for you.  All you need to do is to supply your base data and then settings to tell the binder how to form this data into the Datum object.  
The settings for this are the `nameKey`, `valueKey`, `tokenFields` and the `valueFields`.  
Datum Settings
- 
- **valueKey** - This is the name of your data field that contains the unique key for the record.
- **nameKey** - This is the name of the data field that contains the display name in your input box.  
- **tokenFields**  - This is a comma separated string that contains the name of your data fields that should be included in the local search.  Of course this does not apply to remote datasets since those use their own search approach.
- **valueFields** - This is a comma separated string that contains the name of your data fields that need to be included in your suggestion templates.  You do not have to include the fields that appear in the `nameKey` and `valueKey` since those are automatically added.  

 
#Typeahead options
All the option settings from the typeahead control are supported.  
See the [typeahead](Readme.md) reference for the available options
The binder adds few settings on top of this:  
- 
- **templateElement**  -  `JQuery` locator as string to locate a hidden element in the html-page that contains the template.  
For example if your hidden element containing the template has the id 'myTemplate' then this value should be set to '#myTemplate'. 
- **tokenFields**  - Seee above.  Note that this value only effects `local` and `prefetch` datasets. 
- **valueFields**  - See above.
 
#Binder extra defaults
Two default settings are also provided by the binder, on top of the typeahead default settings.
Defaulted settings
- 
- **engine**:  Hogan
- **name**:  the element id of the input control

See the [Knockout example](Knockout.md) about examples on how the data binder is applied.

