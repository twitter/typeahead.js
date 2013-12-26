About this fork
====
This fork is intended to solve critical bugs and supply basic functionality sorely missing in current version of typeahead.js.  
Main reason of course being able to use this control in my application.  
As the list of necessary changes grew larger the need for documentation and sharing with the community grew larger. I have a sneaky suspicion that there are many others in similar problems with this control as I am and many of the features and bugs have been solved or semi-solved many times over by individuals like myself.  
Hopefully the maintainers of the typeahead control will take some if not all of the features into this or next version of the control.

#The quick overview of changes
**1)** **Critical bugfix** - IE11 problems caused by failed browser detection.  
**2)** **Bugfix** - Mouse-click on dropdown selection caused focus and blur events to occur on the input control.  
**3)** **Critical Bugfix** - Local data suggestion search broke on suggestions that had space in the display name.  
**4)** **New urgent feature** - Allowing for custom, on-demand data retrieval without direct Ajax call.  
**5)** **New urgent feature** - Not to require display names to be unique  
**6)** **New urgent feature** - Getting control over the internal cache for remote data  
**7)** **Much requested basic feature** - Get some handle on when customer exits input box without picking name from the suggestion list.  
**8)** **Requested basic feature** Get suggestions before typing starts.  
**9)**  **A must for myself..** - Nicely working Knockout Binding Handler, simplifying the set-up of the control and data-binding to the typed text, the selected datum and the suggestion data.

The changes in more detail
====
#1) Bugfix: IE11 problems
This bug was identified and reported by @nathankoop (#557).  Modification of the isMsie function resolves the issue.
#2) Bugfix: Blur/Focus flickering
When user uses mouse click to select suggestion in the dropdown list, the dropdown list receives the focus and thus blurs the input box.  In the current hack to try to minimize the affect of this but still this causes blur/focus flickering on the input box.  The solution was simply to stop the mouseDown event on the dropdown to bubble and then remove the 'hack' in the _handleSelection handler.
#3) Bugfix: Local data search
The local data suggestion search does not handle suggestions that include space.  Also it has been criticized for being resource expensive and over complicated.  
I rewrote the search to behave on spaced suggestions.  It now takes the original query unchanged for the search.  It priorities the search on the suggestion display value first, before looking at other tokens.  The implementation should also be a bit faster in most situations.  Of course this search could be made even faster by some optimization and search mechanics like bubble sort.  However there is always the tradeoff between spending CPU on preparing the data for search and the actual search  itself.   I also included an option (**` localSearcher` **) for users to do their own implementation of local search.
You could also argue that instead of using large amount of data locally would better be resolved by using the remote option.
#4) Custom data retreival
The ability to control the data-retrieval better than just controlling Ajax lookup is vital for many applications (like my own).  For example users using view models and own implementations of data-lookups require this sourly.  This regards both the issue of reusing internal functions and controlling the display while the data retrieval takes place, i.e. managing progress indicators and other custom stuff. 
I have seen at least two pull requests that address this issue but they both lack the ability to use the caching and throttling options the remote url offers.  Also proper asynchronous support was missing: handling of promises.
My implementation addresses this.  It supports but does not require handling of JQuery and Q promises.   
The new **handler** option is used for this for remote datasets (name suggested by @cusspvz).   
For prefetch datasets the **prefetchHandler** option is used.
#5) Keys & display names
I would think that at least quarter of use cases for auto completion involves data with unique keys -> where display names may not be unique.  So it is a basic requirement for this control.  Ryan Pitts recently issued an excellent pull request (546) to address this and i have included it in this fork.  I have also introduced the implementation of selected datum that is updated on selection or auto completion.  New interface methods: **`getDatum`** and **`setDatum`** allow for JQuery interface to this value.  This is also related to the selection validation issue below.
#6) Caching control
Many users are apparently having issues with the caching mechanism for the control, mainly lacking methods of clearing it.  Cache is also an issue in single page applications that may re-use html sections but with different context.
I have implemented 4 new ways of interfering with the cache.    
**a)** typeahead interface method of clearing cache **`clearCache`**.  
**b)** **`skipCache`** option to not use caching for remote data.  
**c)** **`cacheKey`** option for the dataset for users to control the cache name for each dataset.  
**d)** **`cacheKey`** as a function returning cache key.  This is particularly useful when you are using the **`handler`** option to retrieve data using internal implementation.  For example if you have two typeahead controls and the other one controlling the context of the second one.  
Note that caching control applies both for `remote` and `prefetch` datasets.
#7) Selection validation
Many users require validation on if the typeahead control produced valid option/`datum` or not.  Some have implemented their own events to address this (like  zhigang1992 , #560 @snjoetw and #530 @ambahk).  I implemented custom event (`typeahead:noSelect`) that fires when user leaves the control without valid selection or the input value is empty (thanks for the tip zhigang1992).  I also added a dataset option `restrictInputToDatum` that insures that user only leaves the control with valid option or empty input value *(this is not strictly a dataset option since it applies to the control but the typeahead control currently only allows for dataset options)*.
#8) Get suggestions before typing starts
The typeahead control could be useful for displaying options before user starts to type in.  Of course only if you have a small set of options.  This could also be used with the `restrictInputToDatum` option.  The implementation of this was quite simple: allow the `minLength` to be 0 and allow the `_getSuggestions` to run with this value.
#9) Knockout Binding Handler
Knockout is very powerful tool for data-binding view models to html pages.  Me myself and many others use it in their SPA applications.  For SPA programmers it is a basic requirement for custom tools to have ready to use Knockout Binding Handler.  
This one also has application beyond just options initialization and two-way data binding. It also handles the task of abstracting the datum object from the viewmodel.  For example the user can data bind the local option to any data that is a list of rows, `knockoutObservable` and `knockoutObservableArray`  included.  The only thing the user has to supply is a mapping info to the dataset columns using the `nameKey`, `valueKey`, `tokenFields` and `valueFields` options.  I think this mapping may be something that could even be implemented within the typeahead control (some day maby).  

**See the [Knockuot.md](Knockout.md) and the [live Plunker Knockout demo](http://plnkr.co/edit/QaRp2m?p=preview) for details.**

#Example page
Example page for the new options and Plunker demos are coming soon..
Until then check out the [Knokout example](Knockout.md) that includes some of the new features.

#Related open issues
I took a quick look at open issues for the last 5 months and it seems that the changes in this fork, are related to or address the following issues:  
**1) Bugfix: IE11 problems**  
 \#557-nathankoop/#554-svakinn  
**2) Bugfix: Blur/Focus flickering**  
\#548-chrisdlangton, #539-rtjm, #460-jaurand  
**3) Bugfix: Local data search**  
\#484-b4umel, #461-vinograd19   
**4) Custom data retrieval**  
\#556-cusspvz, #536-harry2607, #518-dwt, #485-ansman, #473-speedblue    
**5) Keys & display names**  
\#547-narrowfail, #546-ryanpitts, #534-Venu85, #523-jdaily, #496-nikmartin, #481-davismj, #459-davidmturner  
**6) Caching control**  
\#562-krazyjakee, #549-chrisdlangton, #542-jasonterando, #521-jgerigmeyer, #515-tellex, #501-PrimoZvanut,  #492-jpbecotte, #476-dtudury, #455-cusspvz  
**7) Selection verification**  
\#566-zhigang1992, #530-ambahk, #526-ahodges13, #512-PetrSnobelt  
**8) Auto suggestion option**  
\#550-netcult, #390-theoephraim  

#Platform Testing
At this moment I have sucessfuly tested this version on IE11, Chrome and Firefox on Windows 8.1  and Safari and Chrome on IPhone.  
If you try out this fork and find any issues please let me know on the [Isues list](https://github.com/Svakinn/typeahead.js/issues) of the fork.  I promise to respond promptly :-)