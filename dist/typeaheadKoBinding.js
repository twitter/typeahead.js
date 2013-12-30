
//Generate datum object for typeahead, based on data record.
//If you need tokens other than for the nameKey and valueKey then you specify those in comma seporated string (tokenFields)
//If you need unwraped fields in the datum (i.e. for use in the hogan template engine) you specify those in comma seporated string (valueFields)
//valueKey specifies the name of the datafield to be set as value/key in typeahead
//nameKey specifies the name of the datafield to be set as the display name in the typeahead
ko.typeaheadDatumGenerate = function (data, tokenFields, valueFields, valueKey, nameKey) {
    if (!data)
        return null;
    valueKey = valueKey || 'value';
    if (valueKey == 'data')
        $.error("The name 'data' is reserved by tha bndnghandler and cannot be used as 'valueKey'");
    nameKey = nameKey || 'name';
    if (nameKey == 'data')
        $.error("The name 'data' is reserved by tha bndnghandler and cannot be used as 'nameKey'");
    var resObj = {};
    var tokens = [];
    var tokenFld = [];
    var valueFld = valueFields.split(',');
    if (!tokenFields) {
        tokenFld.push(valueKey);
        if (valueKey != nameKey)
            tokenFld.push(valueKey);
    } else
        tokenFld = tokenFields.split(',');
    resObj[valueKey] = ko.unwrap(data[valueKey]);
    resObj[nameKey] = ko.unwrap(data[nameKey]);
    resObj['data'] = data;
    for (var i = 0; i < valueFld.length; i++) {
        if (valueFld[i].trim() == 'data')
            $.error("The name 'data' is reserved by tha bndnghandler and cannot be used in 'valueFields'");
        resObj[valueFld[i].trim()] = ko.unwrap(data[valueFld[i].trim()]);
    }
    for (var i = 0; i < tokenFld.length; i++)
        if (tokenFld[i].trim()) {
            var val = ko.unwrap(data[tokenFld[i].trim()]);
            if (val) {
                var found = false;
                for (var j = 0; j < tokens.length; j++)
                    if (tokens[j] == val) {
                        found = true;
                        break;
                    }
                if (!found)
                    tokens.push(ko.unwrap(data[tokenFld[i].trim()]));
            }
        }
    resObj['tokens'] = tokens;
    return resObj;
};

//The purpose of this function is to groome dataset as Datum dataset
//It is run for local data and as a filter function on remote data.  If remot data contains filter it is run before grooming takes place
ko.typeaheadPreFilter = function (data, tokenFields, valueFields, valueKey, nameKey, filterFn) {
    var dd;
    var d;
    if (filterFn && typeof filterFn == 'function') {
        dd = filterFn(data);
        d = ko.unwrap(dd);
    } else
        d = ko.unwrap(data);
    var newData = [];
    if (d) {
        for (var i = 0; i < d.length; i++)
            newData.push(ko.typeaheadDatumGenerate(d[i], tokenFields, valueFields, valueKey, nameKey));
    }
    return newData;
};
ko.bindingHandlers.typeahead = {
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        //var allBindings = allBindingsAccessor();
        var values = valueAccessor();
        var key = ko.unwrap(values.valueKey);
        var nameKey = ko.unwrap(values.nameKey) || key;
        var tokenFields = ko.unwrap(values.tokenFields) || '';
        var valueFields = ko.unwrap(values.valueFields) || '';
        if (values.hasOwnProperty('selectedDatum')) {
            if (element && typeof $(element).typeahead == 'function') {
                var data = ko.unwrap(values.selectedDatum);
                var datum = ko.typeaheadDatumGenerate(data, tokenFields, valueFields, key, nameKey);
                var currDatum = $(element).typeahead('getDatum');
                if (currDatum && data && key) {
                    if (currDatum[key] != datum[key])
                        $(element).typeahead('setDatum', datum);
                    else {
                        if ($(element).val() != datum[nameKey])
                            $(element).val(datum[nameKey]);
                    }
                } else if (currDatum || datum)
                    $(element).typeahead('setDatum', datum);
            }
        }
    },
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var val = valueAccessor();
        if (!$.isArray(val)) {
            val = [val];
        }
        var opts = [];
        var selectedDatum, isBusy, onAutoCompleted, onSelected, onNoSelect, onOpened, onClosed, onInitialized;
        var alen = val.length;
        for (var i = 0; i < alen; i++) {
            value = val[i];
            var value = valueAccessor();
            var name = ko.unwrap(value.name);
            var minLength = ko.unwrap(value.minLength);
            var valueKey = ko.unwrap(value.valueKey);
            var nameKey = ko.unwrap(value.nameKey) || valueKey;
            var cacheKey = ko.unwrap(value.cacheKey);
            var skipCache = ko.unwrap(value.skipCache);
            var limit = ko.unwrap(value.limit);
            var restrictInputToDatum = value.restrictInputToDatum;
            var template = ko.unwrap(value.template);
            var templateElement = ko.unwrap(value.templateElement);
            var tokenFields = ko.unwrap(value.tokenFields) || '';
            var valueFields = ko.unwrap(value.valueFields) || '';
            var engine = ko.unwrap(value.engine);
            var header = ko.unwrap(value.header);
            var footer = ko.unwrap(value.footer);
            var local = ko.unwrap(value.local);
            var matcher = ko.unwrap(value.matcher);
            var prefetch = ko.unwrap(value.prefetch);
            var remote = ko.unwrap(value.remote);

            //We also allow remote and prefetch options to be defined globally (more conveinient if you are only using one of them at a time)
            var url = ko.unwrap(value.url);
            var ttl = ko.unwrap(value.ttl);
            var filter = ko.unwrap(value.filter);
            var dataType = ko.unwrap(value.dataType);
            var cache = ko.unwrap(value.cache);
            var timeout = ko.unwrap(value.timeout);
            var wildcard = ko.unwrap(value.wildcard);
            var replace = ko.unwrap(value.replace);
            var rateLimitFn = ko.unwrap(value.rateLimitFn);
            var rateLimitWait = ko.unwrap(value.rateLimitWait);
            var maxParallelRequests = ko.unwrap(value.maxParallelRequests);
            var beforeSend = ko.unwrap(value.beforeSend);
            var handler = ko.unwrap(value.handler);
            var prefetchHandler = ko.unwrap(value.prefetchHandler);
            selectedDatum = value.selectedDatum;
            isBusy = value.isBusy;
            onAutoCompleted = ko.unwrap(value.onAutoCompleted);
            onSelected = ko.unwrap(value.onSelected);
            onOpened = ko.unwrap(value.onOpened);
            onClosed = ko.unwrap(value.onClosed);
            onInitialized = ko.unwrap(value.onInitialized);
            onNoSelect = ko.unwrap(value.onNoSelect);
            var options = {};
            if (name)
                options.name = name;
            if (valueKey)
                options.valueKey = valueKey;
            if (!valueKey)
                $.error("The 'valueKey' opton is requied by this binding handler!");
            if (nameKey)
                options.nameKey = nameKey;
            if (restrictInputToDatum)
                options.restrictInputToDatum = restrictInputToDatum;
            if (cacheKey)
                options.cacheKey = cacheKey;
            if (limit)
                options.limit = limit;
            if (minLength || minLength === 0)
                options.minLength = minLength;

            if (templateElement)
                options.template = $(templateElement).html();
            else if (template)
                options.template = template;
            if (engine)
                options.engine = engine;
            if (header)
                options.header = header;
            if (footer)
                options.footer = footer;
            if (local)
                options.local = ko.typeaheadPreFilter(local, tokenFields, valueFields, valueKey, nameKey, filter);
            if (matcher)
                options.matcher = matcher;
            if (prefetch || prefetchHandler) {
                var lfilter = null;
                var prefOptions = {};

                //Function executed by typeahead (as the typeahead prefetch filter function) to convert base dataset to typeahead detum
                //Will also execute the original filter function if included (lfilter)
                function preFilter(data) {
                    return ko.typeaheadPreFilter(data, tokenFields, valueFields, valueKey, nameKey, lfilter);
                }

                if (prefetchHandler)
                    prefOptions.prefetchHandler = prefetchHandler;
                else if (typeof prefetch == 'function')
                    prefOptions.prefetchHandler = prefetch;
                else if (typeof prefetch == "string" || (typeof prefetch == "object" && prefetch.constructor === String))
                    prefOptions.url = prefetch;
                else if (typeof prefetch == 'object') {
                    var lurl = ko.unwrap(prefetch.url);
                    var lttl = ko.unwrap(prefetch.ttl);
                    var lhandler = ko.unwrap(prefetch.prefetchHandler);
                    var lSkip = ko.unwrap(prefetch.skipCache);
                    lfilter = ko.unwrap(prefetch.filter);
                    if (lhandler)
                        prefOptions.prefetchHandler = lhandler;
                    else if (lurl)
                        prefOptions.url = lurl;
                    if (lttl)
                        prefOptions.ttl = lttl;
                    if (lSkip || lSkip === false)
                        prefOptions.skipCache = lSkip;
                }

                if (filter && !lfilter)
                    lfilter = filter;
                if (prefetchHandler && !prefOptions.prefetchHandler && !prefOptions.url)
                    prefOptions.prefetchHandler = prefetchHandler;
                if (url && !prefOptions.url)
                    prefOptions.url = url;
                if (ttl && !prefOptions.ttl)
                    prefOptions.ttl = ttl;
                if (skipCache && !(prefOptions.skipCache || prefOptions.skipCache === false))
                    prefOptions.skipCache = skipCache;
                prefOptions.filter = preFilter;
                options.prefetch = prefOptions;
            }
            if (remote || handler) {
                var remoteOptions = {};
                var lfilter = null;
                if (remote && typeof remote == 'function')
                    remoteOptions.handler = remote;
                else if (handler || typeof handler == 'function')
                    remoteOptions.handler = handler;
                else if (handler)
                    remoteOptions.url = handler;
                else if (typeof remote == 'string' || (typeof remote == 'object' && remote.constructor === String))
                    remoteOptions.url = remote;
                else if (typeof remote == 'object') {
                    //Check for local options
                    var lurl = ko.unwrap(remote.url);
                    var lhandler = ko.unwrap(remote.handler);
                    var ldataType = ko.unwrap(remote.url);
                    var lcache = ko.unwrap(remote.cache);
                    var lcacheKey = ko.unwrap(remote.cacheKey);
                    var lskipCache = ko.unwrap(remote.skipCache);
                    var ltimeout = ko.unwrap(remote.timeout);
                    var lwildcard = ko.unwrap(remote.wildcard);
                    var lreplace = ko.unwrap(remote.replace);
                    var lrateLimitFn = ko.unwrap(remote.rateLimitFn);
                    var lrateLimitWait = ko.unwrap(remote.rateLimitWait);
                    var lmaxParallelRequests = ko.unwrap(remote.maxParallelRequests);
                    var lbeforeSend = ko.unwrap(remote.beforeSend);
                    lfilter = ko.unwrap(remote.filter);
                    if (lurl)
                        remoteOptions.url = lurl;
                    if (ldataType)
                        remoteOptions.dataType = ldataType;
                    if (lcache)
                        remoteOptions.cache = lcache;
                    if (lcache)
                        remoteOptions.cacheKey = lcacheKey;
                    if (lskipCache || lskipCache === false)
                        remoteOptions.skipCache = lskipCache;
                    if (ltimeout)
                        remoteOptions.timeout = ltimeout;
                    if (lwildcard)
                        remoteOptions.wildcard = lwildcard;
                    if (lreplace)
                        remoteOptions.replace = lreplace;
                    if (lrateLimitFn)
                        remoteOptions.rateLimitFn = lrateLimitFn;
                    if (lrateLimitWait)
                        remoteOptions.rateLimitWait = lrateLimitWait;
                    if (lmaxParallelRequests)
                        remoteOptions.maxParallelRequests = lmaxParallelRequests;
                    if (lbeforeSend)
                        remoteOptions.beforeSend = lbeforeSend;
                    if (filter && !lfilter)
                        lfilter = filter;
                }

                //Function executed by typeahead (as the typeahead remote filter function) to convert base dataset to typeahead detum
                //Will also execute the original filter function if included (lfilter)
                function remFilter(data) {
                    return ko.typeaheadPreFilter(data, tokenFields, valueFields, valueKey, nameKey, lfilter);
                }

                if (url && !remoteOptions.url)
                    remoteOptions.url = url;
                if (handler && !remoteOptions.handler)
                    remoteOptions.handler = handler;
                if (dataType && !remoteOptions.url)
                    remoteOptions.dataType = dataType;
                if (cache && !remoteOptions.url)
                    remoteOptions.cache = cache;
                if (cacheKey && !remoteOptions.cacheKey)
                    remoteOptions.cacheKey = cacheKey;
                if ((skipCache || skipCache === false) && (!remoteOptions.skipCache && remoteOptions.skipCache !== false))
                    remoteOptions.skipCache = skipCache;
                if (timeout && !remoteOptions.timeout)
                    remoteOptions.timeout = timeout;
                if (wildcard && !remoteOptions.wildcard)
                    remoteOptions.wildcard = wildcard;
                if (replace && !remoteOptions.replace)
                    remoteOptions.replace = replace;
                if (rateLimitFn && !remoteOptions.rateLimitFn)
                    remoteOptions.rateLimitFn = rateLimitFn;
                if (rateLimitWait && !remoteOptions.rateLimitWait)
                    remoteOptions.rateLimitWait = rateLimitWait;
                if (maxParallelRequests && !remoteOptions.maxPerallelRequests)
                    remoteOptions.maxParallelRequests = maxParallelRequests;
                if (beforeSend && !remoteOptions.beforeSend)
                    remoteOptions.beforeSend = beforeSend;
                remoteOptions.filter = remFilter;
                options.remote = remoteOptions;
            }

            if (!name)
                options.name = element.id;

            if (options.template && !options.engine && Hogan)
                options.engine = Hogan;
            options.tracer = [];
            opts.push(options);
        }
        $(element).attr('autocomplete', 'off');
        $(element).typeahead(opts);
        if (onAutoCompleted)
            $(element).on('typeahead:autocompleted', onAutoCompleted);
        if (onSelected)
            $(element).on('typeahead:selected', onSelected);
        if (onOpened)
            $(element).on('typeahead:opened', onOpened);
        if (onClosed)
            $(element).on('typeahead:closed', onClosed);
        if (onInitialized)
            $(element).on('typeahead:initialized', onInitialized);
        if (onNoSelect)
            $(element).on('typeahead:noSelect', onNoSelect);
        if (selectedDatum) {
            //Handling databinding of selectedDatum back to viewmodel
            $(element).on('typeahead:autocompleted typeahead:selected', function (e, datum) {
                onSelectedDatum(valueAccessor(), datum);
            });
            $(element).on('typeahead:noSelect', function (e, inputText) {
                onSelectedDatum(valueAccessor(), null);
            });
        }
        if (isBusy) {
            $(element).on('typeahead:busyUpdate', function (e, isBusy) {
                valueAccessor().isBusy(isBusy);
            });
        }
        function onSelectedDatum(updateValue, datum) {
            if (updateValue.selectedDatum && datum && datum.hasOwnProperty('data'))
                updateValue.selectedDatum(datum.data);
            else
                updateValue.selectedDatum(null);
        }
    }
};