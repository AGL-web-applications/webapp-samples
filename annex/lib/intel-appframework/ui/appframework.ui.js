/**
 * appframework.ui - A User Interface library for App Framework applications
 *
 * @copyright 2011 Intel
 * @author Intel
 * @version 2.0
 */
 /* global af*/
 /* global numOnly*/
 /* global intel*/
 /* jshint camelcase:false*/
(function($) {
    "use strict";

    var startPath = window.location.pathname + window.location.search;
    var defaultHash = window.location.hash;
    var previousTarget = defaultHash;
    var ui = function() {
        // Init the page
        var that = this;

        /**
         * Helper function to setup the transition objects
         * Custom transitions can be added via $.ui.availableTransitions
           ```
           $.ui.availableTransitions['none']=function();
           ```
           */

        this.availableTransitions = {};
        this.availableTransitions["default"] = this.availableTransitions.none = this.noTransition;
        //setup the menu and boot touchLayer

        //Hack  for AMD/requireJS support
        //set autolaunch = false
        if ((typeof define === "function" && define.amd)||(typeof module !== "undefined" && module.exports)) {
            that.autoLaunch=false;
        }

        var setupAFDom = function() {
            //boot touchLayer
            //create afui element if it still does not exist
            var afui = document.getElementById("afui");
            if (afui === null) {
                afui = document.createElement("div");
                afui.id = "afui";
                var body = document.body;
                while (body&&body.firstChild) {
                    afui.appendChild(body.firstChild);
                }
                $(document.body).prepend(afui);
            }
            that.isIntel="intel" in window&&window.intel&&window.intel.xdk&&"app" in window.intel.xdk;
            if ($.os.supportsTouch) $.touchLayer(afui);
            setupCustomTheme();

        };


        if (document.readyState === "complete" || document.readyState === "loaded") {
            setupAFDom();
            if(that.init)
                that.autoBoot();
            else{
                $(window).one("afui:init", function() {
                    that.autoBoot();
                });
            }
        } else $(document).ready(
            function() {
                setupAFDom();
                if(that.init)
                    that.autoBoot();
                else{
                    $(window).one("afui:init", function() {
                        that.autoBoot();
                    });
                }
            },
        false);



        if (!("intel" in window)){
            window.intel = {xdk:{}};
            window.intel.xdk.webRoot = "";
        }

        //click back event
        window.addEventListener("popstate", function() {
            if(!that.useInternalRouting) return;
            var id = that.getPanelId(document.location.hash);
            var hashChecker = document.location.href.replace(document.location.origin + "/", "");
            //make sure we allow hash changes outside afui
            if (hashChecker === "#") return;
            if (id === "" && that.history.length === 1) //Fix going back to first panel and an empty hash
                id = "#" + that.firstDiv.id;
            if (id === "") return;
            if (af(id).filter(".panel").length === 0) return;
            if (id !== "#" + that.activeDiv.id) that.goBack();
        }, false);

        function setupCustomTheme() {

            if (that.useOSThemes) {
                $("#afui").removeClass("ios ios7 win8 tizen bb android light dark firefox");
                if ($.os.android) $("#afui").addClass("android");
                else if ($.os.ie) {
                    $("#afui").addClass("win8");
                } else if ($.os.blackberry||$.os.blackberry10||$.os.playbook) {
                    $("#afui").addClass("bb");
                    that.backButtonText = "Back";
                } else if ($.os.ios7){
                    $("#afui").addClass("ios7");
                   
                } else if ($.os.ios)
                    $("#afui").addClass("ios");
                else if($.os.tizen)
                    $("#afui").addClass("tizen");
                else if($.os.fennec){
                    $("#afui").addClass("firefox");
                    that.animateHeaders=false;
                }
            }

            if($.os.ios){
                $("head").find("#iosBlurrHack").remove();
                var hackStyle="-webkit-backface-visibility: hidden;";
                //ios webview still has issues
                //if(navigator.userAgent.indexOf("Safari") === -1) {
                hackStyle+="-webkit-perspective:1000;";
                //}
                //$("head").append("<style id='iosBlurrHack'>#afui .panel  {"+hackStyle+"} #afui .panel > * {-webkit-backface-visibility:hidden;}</style>");
                $("head").append("<style id='iosBlurrHack'>#afui .y-scroll > *, #afui .x-scroll > * {"+hackStyle+"}</style>");
            }
            else if ($.os.android&&!$.os.androidICS){
                that.transitionTime = "150ms";
            }
            else if($.os.fennec){
                that.ready(function(){
                    window.addEventListener("deviceorientation",function(){
                        var tmpH=numOnly($("#header").css('height'))+numOnly($("#navbar").css('height'));
                        $("#content").css("height",window.innerHeight-tmpH);
                    });
                });
            }

            if($.os.ios7&&$("#afui").hasClass("ios7")){
                if(that.overlayStatusbar){
                    that.ready(function(){
                        $("#afui").addClass("overlayStatusbar");
                    });

                    $(document.body).css("background","rgb(249,249,249)");
                }
            }

        }
    };


    ui.prototype = {
        init:false,
        transitionTime: "230ms",
        showLoading: true,
        loadingText: "Loading Content",
        loadContentQueue: [],
        isIntel: false,
        titlebar: "",
        navbar: "",
        header: "",
        viewportContainer: "",
        remotePages: {},
        history: [],
        homeDiv: "",
        screenWidth: "",
        content: "",
        modalWindow: "",
        customFooter: false,
        defaultFooter: "",
        defaultHeader: null,
        customMenu: false,
        customAside:false,
        defaultAside:"",
        defaultMenu: "",
        _readyFunc: null,
        doingTransition: false,
        passwordBox: $.passwordBox ? new $.passwordBox() : false,
        selectBox: $.selectBox ? $.selectBox : false,
        ajaxUrl: "",
        transitionType: "slide",
        scrollingDivs: {},
        firstDiv: "",
        hasLaunched: false,
        isLaunching:false,
        launchCompleted: false,
        activeDiv: "",
        customClickHandler: "",
        menuAnimation: null,
        togglingSideMenu: false,
        sideMenuWidth: "200px",
        handheldMinWidth: "768",
        trimBackButtonText: true,
        useOSThemes: true,
        overlayStatusbar: false,
        lockPageBounce: true,
        animateHeaders: true,
        useAutoPressed: true,
        horizontalScroll:false,
        _currentHeaderID:"defaultHeader",
        useInternalRouting:true,

        autoBoot: function() {
            this.hasLaunched = true;
            var that=this;
            if (this.autoLaunch) {
                if(this.isIntel){
                    var xdkLaunch=function(){
                        that.launch();
                        document.removeEventListener("intel.xdk.device.ready",xdkLaunch);
                    };
                    document.addEventListener("intel.xdk.device.ready",xdkLaunch);
                }
                else {
                    this.launch();
                }
            }
        },
        css3animate: function(el, opts) {
            el = $(el);
            return el.css3Animate(opts);
        },
        dispatchPanelEvent:function(fnc,myPanel){
            if (typeof fnc === "string" && window[fnc]) {
                return window[fnc](myPanel);
            }
            else if(fnc.indexOf(".")!==-1){
                var scope=window,items=fnc.split("."),len=items.length,i=0;
                for(i;i<len-1;i++){
                    scope=scope[items[i]];
                    if(scope===undefined) return;
                }
                return scope[items[i]](myPanel);
            }
        },
        /**
         * This enables the tab bar ability to keep pressed states on elements
           ```
           $.ui.enableTabBar();
           ```
           @title $.ui.enableTabBar
         */
        enableTabBar:function(){
            $(document).on("click",".button-grouped.tabbed",function(e){
                var $el=$(e.target);
                $el.closest(".tabbed").find(".button").data("ignore-pressed","true").removeClass("pressed");
                //this is a hack, but the touchEvents plugn will remove pressed
                $el.closest(".button").addClass("pressed");
                setTimeout(function(){
                    $el.closest(".button").addClass("pressed");
                });
            });
        },
         /**
         * This disables the tab bar ability to keep pressed states on elements
           ```
           $.ui.disableTabBar();
           ```
         * @title $.ui.disableTabBar
         */
        disableTabBar:function(){
            $(document).off("click",".button-grouped.tabbed");
            $(".button-grouped.tabbed .button").removeAttr("data-ignore-pressed");
        },
        /**
         * This changes the side menu width
           ```
           $.ui.setLeftSideMenuWidth('300px');
           ```
         * @title $.ui.setLeftSideMenuWidth
         */

        setLeftSideMenuWidth: function(width) {
            this.sideMenuWidth = width;
            //override the css style
            width = width + "";
            width = width.replace("px", "") + "px";
            var theWidth=numOnly(window.innerWidth)-numOnly(width);
            $("head").find("style#afui_sideMenuWidth").remove();
            var css = "@media handheld, only screen and (min-width: 768px) {"+
                        "#afui > #navbar.hasMenu.splitview, #afui > #header.hasMenu.splitview, #afui > #content.hasMenu.splitview  {"+
                        "    margin-left:"+width+" !important;"+
                        "    width: "+(theWidth)+"px !important;"+
                        "}"+
                    "}"+
                    "#afui #menu {width:" + width + "  !important}";
            $("head").append("<style id='afui_sideMenuWidth'>"+css+"</style>");
        },
        setSideMenuWidth:function(){
            this.setLeftSideMenuWidth.apply(this,arguments);
        },
        /**
         * This changes the side menu width
           ```
           $.ui.setRightSideMenuWidth('300px');
           ```
         *@title $.ui.setRightSideMenuWidth
         */

        setRightSideMenuWidth: function(width) {
            this.sideMenuWidth = width;
            //override the css style
            width = width + "";
            width = width.replace("px", "") + "px";
            $("head").find("style#afui_asideMenuWidth").remove();
            $("head").append("<style id='afui_asideMenuWidth'>#afui #aside_menu {width:" + width + "  !important}</style>");
        },


        /**
         * this will disable native scrolling on iOS
            ```
            $.ui.disableNativeScrolling);
            ```
         *@title $.ui.disableNativeScrolling
         */
        disableNativeScrolling: function() {
            $.feat.nativeTouchScroll = false;
        },

        /**
          * This is a boolean property.   When set to true, we manage history and update the hash
             ```
            $.ui.manageHistory=false;//Don't manage for apps using Backbone
            ```
          *@title $.ui.manageHistory
          */
        manageHistory: true,

        /**
         * This is a boolean property.  When set to true (default) it will load that panel when the app is started
           ```
           $.ui.loadDefaultHash=false; //Never load the page from the hash when the app is started
           $.ui.loadDefaultHash=true; //Default
           ```
         *@title $.ui.loadDefaultHash
         */
        loadDefaultHash: true,
        /**
         * This is a boolean that when set to true will add "&cache=_rand_" to any ajax loaded link
           The default is false
           ```
           $.ui.useAjaxCacheBuster=true;
           ```
          *@title $.ui.useAjaxCacheBuster
          */
        useAjaxCacheBuster: false,
        /**
         * This is a shorthand call to the $.actionsheet plugin.  We wire it to the afui div automatically
           ```
           $.ui.actionsheet("<a href='javascript:;' class='button'>Settings</a> <a href='javascript:;' class='button red'>Logout</a>")
           $.ui.actionsheet("[{
                        text: 'back',
                        cssClasses: 'red',
                        handler: function () { $.ui.goBack(); ; }
                    }, {
                        text: 'show alert 5',
                        cssClasses: 'blue',
                        handler: function () { alert("hi"); }
                    }, {
                        text: 'show alert 6',
                        cssClasses: '',
                        handler: function () { alert("goodbye"); }
                    }]");
           ```
         * @param {(string|Array.<string>)} links
         * @title $.ui.actionsheet()
         */
        actionsheet: function(opts) {
            return $.query("#afui").actionsheet(opts);
        },
        /**
         * This is a wrapper to $.popup.js plugin.  If you pass in a text string, it acts like an alert box and just gives a message
           ```
           $.ui.popup(opts);
           $.ui.popup( {
                        title:"Alert! Alert!",
                        message:"This is a test of the emergency alert system!! Don't PANIC!",
                        cancelText:"Cancel me",
                        cancelCallback: function(){console.log("cancelled");},
                        doneText:"I'm done!",
                        doneCallback: function(){console.log("Done for!");},
                        cancelOnly:false
                      });
           $.ui.popup('Hi there');
           ```
         * @param {(object|string)} options
         * @title $.ui.popup(opts)
         */
        popup: function(opts) {
            return $.query("#afui").popup(opts);
        },

        /**
         *This will throw up a mask and block the UI
         ```
         $.ui.blockUI(.9)
         ````
         * @param {number} opacity
         * @title $.ui.blockUI(opacity)
         */
        blockUI: function(opacity) {
            $.blockUI(opacity);
        },
        /**
         *This will remove the UI mask
         ```
         $.ui.unblockUI()
         ````
         * @title $.ui.unblockUI()
         */
        unblockUI: function() {
            $.unblockUI();
        },
        /**
         * Will remove the bottom nav bar menu from your application
           ```
           $.ui.removeFooterMenu();
           ```
         * @title $.ui.removeFooterMenu
         */
        removeFooterMenu: function() {
            $.query("#navbar").hide();
            //$.query("#content").css("bottom", "0px");
            this.showNavMenu = false;
        },
        /**
         * Boolean if you want to show the bottom nav menu.
           ```
           $.ui.showNavMenu = false;
           ```
         * @api private
         * @title $.ui.showNavMenu
         */
        showNavMenu: true,
        /**
         * Boolean if you want to auto launch afui
           ```
           $.ui.autoLaunch = false; //
         * @title $.ui.autoLaunch
         */
        autoLaunch: true,
        /**
         * Boolean if you want to show the back button
           ```
           $.ui.showBackButton = false; //
         * @title $.ui.showBackButton
         */
        showBackbutton: true, // Kept for backward compatibility.
        showBackButton: true,
        /**
         *  Override the back button text
            ```
            $.ui.backButtonText="Back"
            ```
         * @title $.ui.backButtonText
         */
        backButtonText: "",
        /**
         * Boolean if you want to reset the scroller position when navigating panels.  Default is true
           ```
           $.ui.resetScrollers=false; //Do not reset the scrollers when switching panels
           ```
         * @title $.ui.resetScrollers
         */
        resetScrollers: false,
        /**
         * function to fire when afui is ready and completed launch
           ```
           $.ui.ready(function(){console.log('afui is ready');});
           ```
         * @param {function} param function to execute
         * @title $.ui.ready
         */
        ready: function(param) {

            if (this.launchCompleted)
                param();
            else {
                $(document).one("afui:ready", function() {
                    param();
                });
            }
        },
        /**
         * Override the back button class name
           ```
           $.ui.setBackButtonStyle('newClass');
           ```
         * @param {string} className new class name
         * @title $.ui.setBackButtonStyle(class)
         */
        setBackButtonStyle: function(className) {
            $.query("#header .backButton").get(0).className=className;

        },
        /**
         * Initiate a back transition
           ```
           $.ui.goBack()
           ```

         * @title $.ui.goBack()
         * @param {number=} delta relative position from the last element (> 0)
         */
        goBack: function(delta) {
            delta = Math.min(Math.abs(~~delta || 1), this.history.length);

            if (delta) {
                var tmpEl = this.history.splice(-delta).shift();
                this.loadContent(tmpEl.target + "", 0, 1, tmpEl.transition);
                this.transitionType = tmpEl.transition;
                this.updateHash(tmpEl.target);
            }
        },
        /**
         * Clear the history queue
           ```
           $.ui.clearHistory()
           ```

         * @title $.ui.clearHistory()
         */
        clearHistory: function() {
            this.history = [];
            this.setBackButtonVisibility(false);
        },

        /**
         * PushHistory
           ```
           $.ui.pushHistory(previousPage, newPage, transition, hashExtras)
           ```
         * @api private
         * @title $.ui.pushHistory()
         */
        pushHistory: function(previousPage, newPage, transition, hashExtras) {
            //push into local history

            this.history.push({
                target: previousPage,
                transition: transition
            });
            //push into the browser history
            try {
                if (!this.manageHistory) return;
                window.history.pushState(newPage, newPage, startPath + "#" + newPage + hashExtras);
                $(window).trigger("hashchange", null, {
                    newUrl: startPath + "#" + newPage + hashExtras,
                    oldUrl: startPath + previousPage
                });
            } catch (e) {}
        },


        /**
         * Updates the current window hash
         *
         * @param {string} newHash New Hash value
         * @title $.ui.updateHash(newHash)
         * @api private
         */
        updateHash: function(newHash) {
            if (!this.manageHistory) return;
            newHash = newHash.indexOf("#") === -1 ? "#" + newHash : newHash; //force having the # in the begginning as a standard
            previousTarget = newHash;

            var previousHash = window.location.hash;
            var panelName = this.getPanelId(newHash).substring(1); //remove the #
            try {
                window.history.replaceState(panelName, panelName, startPath + newHash);
                $(window).trigger("hashchange", null, {
                    newUrl: startPath + newHash,
                    oldUrl: startPath + previousHash
                });
            } catch (e) {}
        },
        /*gets the panel name from an hash*/
        getPanelId: function(hash) {
            var firstSlash = hash.indexOf("/");
            return firstSlash === -1 ? hash : hash.substring(0, firstSlash);
        },

        /**
         * Update a badge on the selected target.  Position can be
            bl = bottom left
            tl = top left
            br = bottom right
            tr = top right (default)
           ```
           $.ui.updateBadge("#mydiv","3","bl","green");
           ```
         * @param {string} target
         * @param {string} value
         * @param {string=} position
         * @param {(string=|object)} color Color or CSS hash
         * @title $.ui.updateBadge(target,value,[position],[color])
         */
        updateBadge: function(target, value, position, color) {
            if (position === undefined) position = "";

            var $target = $(target);
            var badge = $target.find("span.af-badge");

            if (badge.length === 0) {
                if ($target.css("position") !== "absolute") $target.css("position", "relative");
                badge = $.create("span", {
                    className: "af-badge " + position,
                    html: value
                });
                $target.append(badge);
            } else badge.html(value);
            badge.removeClass("tl bl br tr");
            badge.addClass(position);
            if (color === undefined)
                color = "red";
            if ($.isObject(color)) {
                badge.css(color);
            } else if (color) {
                badge.css("background", color);
            }
            badge.data("ignore-pressed", "true");

        },
        /**
         * Removes a badge from the selected target.
           ```
           $.ui.removeBadge("#mydiv");
           ```
         * @param {string} target
         * @title $.ui.removeBadge(target)
         */
        removeBadge: function(target) {
            $(target).find("span.af-badge").remove();
        },
        /**
         * Toggles the bottom nav menu.  Force is a boolean to force show or hide.
           ```
           $.ui.toggleNavMenu();//toggle it
           $.ui.toggleNavMenu(true); //force show it
           ```
         * @param {boolean=} force
         * @title $.ui.toggleNavMenu([force])
         */
        toggleNavMenu: function(force) {
            if (!this.showNavMenu) return;
            if ($.query("#navbar").css("display") !== "none" && ((force !== undefined && force !== true) || force === undefined)) {
                $.query("#navbar").hide();
            } else if (force === undefined || (force !== undefined && force === true)) {
                $.query("#navbar").show();

            }
        },
        /**
         * Toggles the top header menu.  Force is a boolean to force show or hide.
           ```
           $.ui.toggleHeaderMenu();//toggle it
           ```
         * @param {boolean=} force
         * @title $.ui.toggleHeaderMenu([force])
         */
        toggleHeaderMenu: function(force) {
            if ($.query("#header").css("display") !== "none" && ((force !== undefined && force !== true) || force === undefined)) {
                $.query("#header").hide();
            } else if (force === undefined || (force !== undefined && force === true)) {
                $.query("#header").show();
            }
        },

        /**
        * Toggles the right hand side menu
        */
        toggleAsideMenu:function(){
            this.toggleRightSideMenu.apply(this,arguments);
        },
        toggleRightSideMenu:function(force,callback,time){
            if(!this.isAsideMenuEnabled()) return;
            return this.toggleLeftSideMenu(force,callback,time,true);
        },
        /**
         * Toggles the side menu.  Force is a boolean to force show or hide.
           ```
           $.ui.toggleSideMenu();//toggle it
           ```
         * @param {boolean=} force
         * @param {function=} callback Callback function to execute after menu toggle is finished
         * @param {number=} time Time to run the transition
         * @param {boolean=} aside 
         * @title $.ui.toggleSideMenu([force],[callback],[time])
         */
        toggleLeftSideMenu: function(force, callback, time, aside) {
            if ((!this.isSideMenuEnabled()&&!this.isAsideMenuEnabled()) || this.togglingSideMenu) return;


            if(!aside&&!this.isSideMenuEnabled()) return;

            if(!aside&&$.ui.splitview && window.innerWidth >= $.ui.handheldMinWidth) return;

            var that = this;
            var menu = $.query("#menu");
            var asideMenu= $.query("#aside_menu");
            var els = $.query("#content,  #header, #navbar");
            var panelMask = $.query(".afui_panel_mask");
            time = time || this.transitionTime;
            var open = this.isSideMenuOn();
            var toX=aside?"-"+numOnly(asideMenu.css("width")):numOnly(menu.css("width"));
            // add panel mask to block when side menu is open for phone devices
            if(panelMask.length === 0 && window.innerWidth < $.ui.handheldMinWidth){
                els.append("<div class='afui_panel_mask'></div>");
                panelMask = $.query(".afui_panel_mask");
                $(".afui_panel_mask").bind("click", function(){
                    $.ui.toggleSideMenu(false, null, null, aside);
                });
            }
            //Here we need to check if we are toggling the left to right, or right to left
            var menuPos=this.getSideMenuPosition();
            if(open&&!aside&&menuPos<0)
                open=false;
            else if(open&&aside&&menuPos>0)
                open=false;

            if (force === 2 || (!open && ((force !== undefined && force !== false) || force === undefined))) {

                this.togglingSideMenu = true;
                if(!aside)
                    menu.show();
                else
                    asideMenu.show();
                that.css3animate(els, {
                    x: toX,
                    time: time,
                    complete: function(canceled) {
                        that.togglingSideMenu = false;
                        els.vendorCss("Transition", "");
                        if (callback) callback(canceled);
                        if(panelMask.length !== 0 && window.innerWidth < $.ui.handheldMinWidth){
                            panelMask.show();
                        }
                    }
                });

            } else if (force === undefined || (force !== undefined && force === false)) {
                this.togglingSideMenu = true;
                that.css3animate(els, {
                    x: "0px",
                    time: time,
                    complete: function(canceled) {
                        // els.removeClass("on");
                        els.vendorCss("Transition", "");
                        els.vendorCss("Transform", "");
                        that.togglingSideMenu = false;
                        if (callback) callback(canceled);
                        if(!$.ui.splitview)
                            menu.hide();
                        asideMenu.hide();
                        if(panelMask.length !== 0 && window.innerWidth < $.ui.handheldMinWidth){
                            panelMask.hide();
                        }
                    }
                });
            }
        },
        toggleSideMenu:function(){

            this.toggleLeftSideMenu.apply(this,arguments);
        },
        /**
         * Disables the side menu
           ```
           $.ui.disableSideMenu();
           ```
        * @title $.ui.disableSideMenu();
        */
        disableSideMenu: function() {
            this.disableLeftSideMenu();
        },
        disableLeftSideMenu:function(){
            var els = $.query("#content, #header, #navbar");
            if (this.isSideMenuOn()) {
                this.toggleSideMenu(false, function(canceled) {
                    if (!canceled) els.removeClass("hasMenu");
                });
            } else els.removeClass("hasMenu");
        },
        /**
         * Enables the side menu if it has been disabled
           ```
           $.ui.enableSideMenu();
           ```
        * @title $.ui.enableSideMenu();
        */
        enableLeftSideMenu: function() {
            $.query("#content, #header, #navbar").addClass("hasMenu");
        },
        enableSideMenu:function(){
            return this.enableLeftSideMenu();
        },

        /**
         * Disables the side menu
           ```
           $.ui.disableSideMenu();
           ```
        * @title $.ui.disableSideMenu();
        */
        disableRightSideMenu:function(){
            var els = $.query("#content, #header, #navbar");
            if (this.isSideMenuOn()) {
                this.toggleSideMenu(false, function(canceled) {
                    if (!canceled) els.removeClass("hasAside");
                });
            } else els.removeClass("hasAside");
        },
        /**
         * Enables the side menu if it has been disabled
           ```
           $.ui.enableRightSideMenu();
           ```
        * @title $.ui.enableRightSideMenu();
        */
        enableRightSideMenu: function() {
            $.query("#content, #header, #navbar").addClass("hasAside");
        },
        /**
         *
         * @title $.ui.isSideMenuEnabled();
         * @api private
         */
        isSideMenuEnabled: function() {
            return $.query("#content").hasClass("hasMenu");
        },
        /**
         *
         * @title $.ui.isAsideMenuEnabled();
         * @api private
         */
        isAsideMenuEnabled: function() {
            return $.query("#content").hasClass("hasAside");
        },
        /**
         *
         * @title $.ui.enableSideMenu();
         * @api private
         */
        isSideMenuOn: function() {
            var menu = this.getSideMenuPosition() !==0 ? true : false;
            return (this.isSideMenuEnabled()||this.isAsideMenuEnabled) && menu;
        },
        /**
         * @title $.ui.getSideMenuPosition();
         * @api private
         */
        getSideMenuPosition:function(){
            return numOnly(parseFloat($.getCssMatrix($("#content")).e));
        },
        /**
         * Boolean that will disable the splitview before launch
           ```
           $.ui.splitView=false;
           ```
          * @title $.ui.splitview
          */
        splitview:true,
        /**
         * Disables the split view on tablets
           ```
           $.ui.disableSplitView();
           ```
         * @title $.ui.disableSplitView();
         */
        disableSplitView:function(){
            $.query("#content, #header, #navbar, #menu").removeClass("splitview");
            this.splitview=false;
        },


        /**
         * Reference to the default footer
         * @api private
         */
        prevFooter: null,
        /**
         * Updates the elements in the navbar
           ```
           $.ui.updateNavbarElements(elements);
           ```
         * @param {(string|object)} elems
         * @title $.ui.updateNavbarElements(Elements)
         */
        updateNavbarElements: function(elems) {
            if (this.prevFooter) {
                if (this.prevFooter.data("parent")){
                    var useScroller = this.scrollingDivs.hasOwnProperty(this.prevFooter.data("parent"));
                    if($.feat.nativeTouchScroll||$.os.desktop || !useScroller ){
                        this.prevFooter.appendTo("#" + this.prevFooter.data("parent"));
                    }
                    else {
                        this.prevFooter.appendTo($("#" + this.prevFooter.data("parent")).find(".afScrollPanel"));
                    }
                }
                else this.prevFooter.appendTo("#afui");
            }
            if (!$.is$(elems)) //inline footer
            {
                elems = $.query("#" + elems);
            }
            $.query("#navbar").append(elems);
            this.prevFooter = elems;
            var tmpAnchors = $.query("#navbar > footer > a:not(.button)");
            if (tmpAnchors.length > 0) {
                tmpAnchors.data("ignore-pressed", "true").data("resetHistory", "true");
                var width = parseFloat(100 / tmpAnchors.length);
                tmpAnchors.css("width", width + "%");
            }
            var nodes = $.query("#navbar footer");
            if (nodes.length === 0) return;
            nodes = nodes.get(0).childNodes;

            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType === 3) {
                    nodes[i].parentNode.removeChild(nodes[i]);
                }
            }

        },
        /**
         * Reference to the previous header
         * @api private
         */
        prevHeader: null,
        /**
         * Updates the elements in the header
           ```
           $.ui.updateHeaderElements(elements);
           ```
         * @param {(string|object)} elems
         * @param {boolean} goBack
         * @title $.ui.updateHeaderElements(Elements)
         */
        updateHeaderElements: function(elems, goBack) {
            var that = this;
            if (!$.is$(elems)) //inline footer
            {
                elems = $.query("#" + elems);
            }
            if (elems === this.prevHeader) return;
            this._currentHeaderID=elems.prop("id");
            if (this.prevHeader) {
                var useScroller = this.scrollingDivs.hasOwnProperty(this.prevHeader.data("parent"));
                //Let's slide them out
                $.query("#header").append(elems);
                //Do not animate - sometimes they act funky
                if (!$.ui.animateHeaders) {
                    if (that.prevHeader.data("parent")){
                        if($.feat.nativeTouchScroll||$.os.desktop || !useScroller ){
                            this.prevHeader.appendTo("#" + this.prevHeader.data("parent"));
                        }
                        else {
                            this.prevHeader.appendTo($("#" + this.prevHeader.data("parent")).find(".afScrollPanel"));
                        }
                    }
                    else that.prevHeader.appendTo("#afui");
                    that.prevHeader = elems;
                    return;
                }

                var from = goBack ? "100px" : "-100px";
                var to = goBack ? "-100px" : "100px";
                that.prevHeader.addClass("ignore");
                that.css3animate(elems, {
                    x: to,
                    opacity: 0.3,
                    time: "1ms"
                });
                that.css3animate(that.prevHeader, {
                    x: from,
                    y: 0,
                    opacity: 0.3,
                    time: that.transitionTime,
                    delay: numOnly(that.transitionTime) / 5 + "ms",
                    complete: function() {
                        if (that.prevHeader.data("parent")){
                            if($.feat.nativeTouchScroll||$.os.desktop || !useScroller ){
                                that.prevHeader.appendTo("#" + that.prevHeader.data("parent"));
                            }
                            else {
                                that.prevHeader.appendTo($("#" + that.prevHeader.data("parent")).find(".afScrollPanel"));
                            }
                        }
                        else that.prevHeader.appendTo("#afui");
                        that.prevHeader.removeClass("ignore");
                        that.css3animate(that.prevHeader, {
                            x: to,
                            opacity: 1,
                            time: "1ms"
                        });
                        that.prevHeader = elems;
                    }
                });
                that.css3animate(elems, {
                    x: "0px",
                    opacity: 1,
                    time: that.transitionTime
                });


            } else {
                $.query("#header").append(elems);
                this.prevHeader = elems;
            }
        },
        /** 
         * @api private
         */
        previAsideMenu:null,
        /**
         * Updates the right hand aside menus
         */

        updateAsideElements:function(){
            return this.updateRightSideMenuElements.apply(this,arguments);
        },
        updateRightSideMenuElements:function(elems){
            if (elems === undefined || elems === null) return;
            var nb = $.query("#aside_menu_scroller");

            if (this.prevAsideMenu) {
                this.prevAsideMenu.insertBefore("#afui #aside_menu");
                this.prevAsideMenu = null;
            }

            if (!$.is$(elems)) elems = $.query("#" + elems);

            if($(elems).attr("title")){
                $(elems).prepend(
                    $.create("header", {className:"header"}).append(
                        $.create("h1", {html:$(elems).attr("title")}).get(0))
                );
                $(elems).removeAttr("title");
            }

            nb.html("");
            nb.append(elems);
            this.prevAsideMenu = elems;
            //Move the scroller to the top and hide it
            this.scrollingDivs.aside_menu_scroller.hideScrollbars();
            this.scrollingDivs.aside_menu_scroller.scrollToTop();
        },
        /**
         * @api private
         * Kept for backwards compatibility
         */
        updateSideMenu: function(elems) {
            return this.updateSideMenuElements(elems);
        },
        /**
         * Updates the elements in the side menu
           ```
           $.ui.updateSideMenuElements(elements);
           ```
         * @param {...(string|object)} elements
         * @title $.ui.updateSideMenuElements(elements)
         */
        updateSideMenuElements: function() {
            return this.updateLeftSideMenuElements.apply(this,arguments);
        },
        updateLeftSideMenuElements:function(elems) {
            if (elems === undefined || elems === null) return;
            var nb = $.query("#menu_scroller");

            if (this.prevMenu) {
                this.prevMenu.insertBefore("#afui #menu");
                this.prevMenu = null;
            }

            if (!$.is$(elems)) elems = $.query("#" + elems);

            if($(elems).attr("title")){
                $(elems).prepend(
                    $.create("header", {className:"header"}).append(
                        $.create("h1", {html:$(elems).attr("title")}).get(0))
                );
                $(elems).removeAttr("title");
            }

            nb.html("");
            nb.append(elems);
            this.prevMenu = elems;
            //Move the scroller to the top and hide it
            this.scrollingDivs.menu_scroller.hideScrollbars();
            this.scrollingDivs.menu_scroller.scrollToTop();
        },

        /**
         * Set the title of the current panel
           ```
           $.ui.setTitle("new title");
           ```

         * @param {string} val
         * @title $.ui.setTitle(value)
         */
        setTitle: function(val) {
            if(this._currentHeaderID !== "defaultHeader") return;
            $.query("#header header:not(.ignore)  #pageTitle").html(val);
        },
        /**
         * Override the text for the back button
           ```
           $.ui.setBackButtonText("GO...");
           ```

         * @param {string} text
         * @title $.ui.setBackButtonText(text)
         */
        setBackButtonText: function(text) {
            if(this._currentHeaderID !== "defaultHeader") return;
            if (this.trimBackButtonText && text.length >= 7)
                text = text.substring(0, 5) + "...";
            if (this.backButtonText.length > 0) $.query("#header header:not(.ignore) .backButton").html(this.backButtonText);
            else $.query("#header header:not(.ignore)  .backButton").html(text);
        },
        /**
         * Toggle visibility of the back button
         */
        setBackButtonVisibility: function(show) {
            if (!show) $.query("#header .backButton").css("visibility", "hidden");
            else $.query("#header .backButton").css("visibility", "visible");
        },
        /**
         * Show the loading mask
           ```
           $.ui.showMask()
           $.ui.showMask('Doing work')
           ```

         * @param {string=} text
         * @title $.ui.showMask(text);
         */
        showMask: function(text) {
            if (!text) text = this.loadingText || "";
            $.query("#afui_mask>h1").html(text);
            $.query("#afui_mask").show();
        },
        /**
         * Hide the loading mask
         * @title $.ui.hideMask();
         */
        hideMask: function() {
            $.query("#afui_mask").hide();
        },
        /**
         * @api private
         */
        modalReference_:null,
        /**
         * Load a content panel in a modal window. 
           ```
           $.ui.showModal("#myDiv","fade");
           ```
         * @param {(string|object)} id panel to show
         * @param {string=} trans
         * @title $.ui.showModal();
         */
        showModal: function(id, trans) {
            var that = this;
            this.modalTransition = trans || "up";
            var modalDiv = $.query("#modalContainer");
            if (typeof(id) === "string")
                id = "#" + id.replace("#", "");
            var $panel = $.query(id);
            this.modalReference_=$panel;
            var modalParent=$.query("#afui_modal");
            if ($panel.length) {
                var useScroller = this.scrollingDivs.hasOwnProperty($panel.attr("id"));
                //modalDiv.html($.feat.nativeTouchScroll || !useScroller ? $.query(id).html() : $.query(id).get(0).childNodes[0].innerHTML + '', true);

                var elemsToCopy;
                if($.feat.nativeTouchScroll||$.os.desktop || !useScroller ){
                    elemsToCopy=$panel.contents();
                    modalDiv.append(elemsToCopy);
                }
                else {
                    elemsToCopy=$($panel.get(0).childNodes[0]).contents();
                    //modalDiv.append(elemsToCopy);
                    modalDiv.children().eq(0).append(elemsToCopy);
                }


                this.runTransition(this.modalTransition, that.modalTransContainer, that.modalWindow, false);
                $(that.modalWindow).css("display","");
                $(that.modalWindow).addClass("display","flexContainer");
                if (useScroller) {

                    this.scrollingDivs.modal_container.enable(that.resetScrollers);
                }
                else {
                    this.scrollingDivs.modal_container.disable();
                }
                modalDiv.addClass("panel").show();
                //modal header
                if($panel.data("header") === "none"){ // no header
                    modalParent.find("#modalHeader").hide();
                } else if(elemsToCopy.filter("header").length>0){ // custom header
                    modalParent.find("#modalHeader").append(elemsToCopy.filter("header")).show();
                } else { // add default header with close
                    modalParent.find("#modalHeader").append(
                        $.create("header", {}).append(
                            $.create("h1", {html:$panel.data("title")}).get(0))
                        .append(
                            $.create("a", {className:"button icon close"}).attr("onclick","$.ui.hideModal()").get(0)
                        )).show();
                }
                //modal footer
                if($panel.data("footer") === "none"){ // no footer
                    modalParent.find("#modalFooter").hide();
                } else if(elemsToCopy.filter("footer").length>0){ // custom footer
                    modalParent.find("#modalFooter").append(elemsToCopy.filter("footer")).show();
                    var tmpAnchors = $.query("#modalFooter > footer > a:not(.button)");
                    if (tmpAnchors.length > 0) {
                        var width = parseFloat(100 / tmpAnchors.length);
                        tmpAnchors.css("width", width + "%");
                    }
                    var nodes = $.query("#modalFooter footer");
                    if (nodes.length === 0) return;
                    nodes = nodes.get(0).childNodes;
                    for (var i = 0; i < nodes.length; i++) {
                        if (nodes[i].nodeType === 3) {
                            nodes[i].parentNode.removeChild(nodes[i]);
                        }
                    }
                } else { // no default footer
                    modalParent.find("#modalFooter").hide();
                }

                this.scrollToTop("modal");
                modalDiv.data("panel", id);
                var myPanel=$panel.get(0);
                var fnc = myPanel.getAttribute("data-load");
                if(fnc)
                    this.dispatchPanelEvent(fnc,myPanel);
                $panel.trigger("loadpanel");

            }
        },
        /**
         * Hide the modal window and remove the content.  We remove any event listeners on the contents.
           ```
           $.ui.hideModal("");
           ```
         * @title $.ui.hideModal();
         */
        hideModal: function() {
            var self = this;
            var $cnt=$.query("#modalContainer");

            var useScroller = this.scrollingDivs.hasOwnProperty(this.modalReference_.attr("id"));


            this.runTransition(self.modalTransition, self.modalWindow, self.modalTransContainer, true);
            this.scrollingDivs.modal_container.disable();

            var tmp = $.query($cnt.data("panel"));
            var fnc = tmp.data("unload");
            if(fnc)
                this.dispatchPanelEvent(fnc,tmp.get(0));
            tmp.trigger("unloadpanel");
            setTimeout(function(){
                if($.feat.nativeTouchScroll||$.os.desktop || !useScroller){
                    self.modalReference_.append($("#modalHeader header"));
                    self.modalReference_.append($cnt.contents());
                    self.modalReference_.append($("#modalFooter footer"));
                }
                else {
                    self.modalReference_.children().eq(0).append($("#modalHeader header"));
                    $(self.modalReference_.get(0).childNodes[0]).append($cnt.children().eq(0).contents());
                    self.modalReference_.children().eq(0).append($("#modalFooter footer"));
                }

               // $cnt.html("", true);
            },this.transitionTime);
        },

        /**
         * Update the HTML in a content panel
           ```
           $.ui.updatePanel("#myDiv","This is the new content");
           ```
         * @param {(string|object)} id
         * @param {string} content HTML to update with
         * @title $.ui.updatePanel(id,content);
         */
        updatePanel: function(id, content) {
            id = "#" + id.replace("#", "");
            var el = $.query(id).get(0);
            if (!el) return;

            var newDiv = $.create("div", {
                html: content
            });
            if (newDiv.children(".panel") && newDiv.children(".panel").length > 0) newDiv = newDiv.children(".panel").get(0);
            else newDiv = newDiv.get(0);


            if (el.getAttribute("js-scrolling") && (el.getAttribute("js-scrolling").toLowerCase() === "yes" || el.getAttribute("js-scrolling").toLowerCase() === "true")) {
                $.cleanUpContent(el.childNodes[0], false, true);
                $(el.childNodes[0]).html(content);
            } else {
                $.cleanUpContent(el, false, true);
                $(el).html(content);
                var scr=this.scrollingDivs[el.id];
                if(scr&&scr.refresh)
                    scr.addPullToRefresh();
            }
            if (newDiv.getAttribute("data-title"))
                el.setAttribute("data-title",newDiv.getAttribute("data-title"));
        },
        /**
         * Same as $.ui.updatePanel.  kept for backwards compatibility
           ```
           $.ui.updateContentDiv("#myDiv","This is the new content");
           ```
         * @param {(string|object)} id
         * @param {string} content HTML to update with
         * @title $.ui.updateContentDiv(id, content);
         */
        updateContentDiv: function(id, content) {
            return this.updatePanel(id, content);
        },
        /**
         * Dynamically creates a new panel.  It wires events, creates the scroller, applies Android fixes, etc.
           ```
           $.ui.addContentDiv("myDiv","This is the new content","Title");
           ```
         * @param {(string|object)} el Element to add
         * @param {string} content
         * @param {string} title
         * @param {boolean=} refresh Enable refresh on pull
         * @param {function=} refreshFunc 
         * @title $.ui.addContentDiv(id, content, title);
         */
        addContentDiv: function(el, content, title, refresh, refreshFunc) {
            var myEl;
            if(typeof(el) === "string") {
                if(el.lastIndexOf("#", 1) === -1) el = "#" + el;
                myEl = $.query(el).get(0);
            } else if($.is$(el)) {
                myEl = el.get(0);
                el = myEl.id;
            } else {
                myEl = el;
                el = myEl.id;
            }
            var newDiv, newId;
            if (!myEl) {
                newDiv = $.create("div", {
                    html: content
                });
                if (newDiv.children(".panel") && newDiv.children(".panel").length > 0) newDiv = newDiv.children(".panel").get(0);
                else newDiv = newDiv.get(0);

                if (!newDiv.getAttribute("data-title") && title) newDiv.setAttribute("data-title",title);
                newId = (newDiv.id) ? newDiv.id : el.replace("#", ""); //figure out the new id - either the id from the loaded div.panel or the crc32 hash
                newDiv.id = newId;
                if (newDiv.id !== el) newDiv.setAttribute("data-crc", el.replace("#", ""));
            } else {
                newDiv = myEl;
            }
            newDiv.className = "panel";
            newId = newDiv.id;
            this.addDivAndScroll(newDiv, refresh, refreshFunc);
            myEl = null;
            newDiv = null;
            return newId;
        },
        /**
         *  Takes a div and sets up scrolling for it..
           ```
           $.ui.addDivAndScroll(object);
           ```
         * @param {object} tmp Element
         * @param {boolean=} refreshPull
         * @param {function} refreshFunc
         * @param {object=} container
         * @title $.ui.addDivAndScroll(element);
         * @api private
         */
        addDivAndScroll: function(tmp, refreshPull, refreshFunc, container) {
            var self=this;
            var jsScroll = false,
                scrollEl;
            var overflowStyle = tmp.style.overflow;
            var hasScroll = overflowStyle !== "hidden" && overflowStyle !== "visible";

            container = container || this.content;
            //sets up scroll when required and not supported

            if (!$.feat.nativeTouchScroll && hasScroll&&!$.os.desktop) tmp.setAttribute("js-scrolling", "true");

            if (tmp.getAttribute("js-scrolling") && (tmp.getAttribute("js-scrolling").toLowerCase() === "yes" || tmp.getAttribute("js-scrolling").toLowerCase() === "true")) {
                jsScroll = true;
                hasScroll = true;
            }
            var title = tmp.getAttribute("data-title")||tmp.title;
            tmp.title = "";
            tmp.setAttribute("data-title",title);


            if($(tmp).hasClass("no-scroll") || (tmp.getAttribute("scrolling") && tmp.getAttribute("scrolling") === "no")) {
                hasScroll = false;
                jsScroll = false;
                tmp.removeAttribute("js-scrolling");
            }

            if (!jsScroll ) {
                container.appendChild(tmp);
                scrollEl = tmp;
                tmp.style["-webkit-overflow-scrolling"] = "none";
            } else {
                //WE need to clone the div so we keep events
                scrollEl=tmp;
                container.appendChild(tmp);
                /*scrollEl = tmp.cloneNode(false);


                tmp.title = null;
                tmp.id = null;
                var $tmp = $(tmp);
                $tmp.removeAttr("data-footer data-aside data-nav data-header selected data-load data-unload data-tab data-crc title data-title");

                $tmp.replaceClass("panel", "afScrollPanel");

                scrollEl.appendChild(tmp);

                container.appendChild(scrollEl);
                */

                if (this.selectBox !== false) this.selectBox.getOldSelects(scrollEl.id);
                if (this.passwordBox !== false) this.passwordBox.getOldPasswords(scrollEl.id);

            }


            if (hasScroll) {
                this.scrollingDivs[scrollEl.id] = ($(tmp).scroller({
                    scrollBars: true,
                    verticalScroll: true,
                    horizontalScroll: self.horizontalScroll,
                    vScrollCSS: "afScrollbar",
                    refresh: refreshPull,
                    useJsScroll: jsScroll,
                    lockBounce: this.lockPageBounce,
                    autoEnable: false //dont enable the events unnecessarilly
                }));
                //backwards compatibility
                $(tmp).addClass("y-scroll");
                if(self.horizontalScroll)
                    $(tmp).addClass("x-scroll");
                if (refreshFunc)
                    $.bind(this.scrollingDivs[scrollEl.id], "refresh-release", function(trigger) {
                        if (trigger) refreshFunc();
                    });
                if(jsScroll){
                    $(tmp).children().eq(0).addClass("afScrollPanel");
                }
            }
            return scrollEl.id;
        },

        /**
         *  Scrolls a panel to the top
           ```
           $.ui.scrollToTop(id);
           ```
         * @param {string} id
         * @param {string} time Time to scroll
         * @title $.ui.scrollToTop(id);
         */
        scrollToTop: function(id, time) {
            time = time || "300ms";
            id = id.replace("#", "");
            if (this.scrollingDivs[id]) {
                this.scrollingDivs[id].scrollToTop(time);
            }
        },
        /**
         *  Scrolls a panel to the bottom
           ```
           $.ui.scrollToBottom(id,time);
           ```
         * @param {string} id
         * @param {string} time Time to scroll
         * @title $.ui.scrollToBottom(id);
         */
        scrollToBottom: function(id, time) {
            id = id.replace("#", "");
            if (this.scrollingDivs[id]) {
                this.scrollingDivs[id].scrollToBottom(time);
            }
        },

        /**
         *  This is used when a transition fires to do helper events.  We check to see if we need to change the nav menus, footer, and fire
         * the load/onload functions for panels
           ```
           $.ui.parsePanelFunctions(currentDiv, oldDiv);
           ```
         * @param {object} what current div
         * @param {object=} oldDiv old div
         * @param {boolean=} goBack
         * @title $.ui.parsePanelFunctions(currentDiv, oldDiv);
         * @api private
         */
        parsePanelFunctions: function(what, oldDiv, goBack) {
            //check for custom footer
            var that = this;
            var hasFooter = what.getAttribute("data-footer");
            var hasHeader = what.getAttribute("data-header");
            //$asap removed since animations are fixed in css3animate
            if (hasFooter && hasFooter.toLowerCase() === "none") {
                that.toggleNavMenu(false);
                hasFooter = false;
            } else {
                that.toggleNavMenu(true);
            }
            if (hasFooter && that.customFooter !== hasFooter) {
                that.customFooter = hasFooter;
                that.updateNavbarElements(hasFooter);
            } else if (hasFooter !== that.customFooter) {
                if (that.customFooter) that.updateNavbarElements(that.defaultFooter);
                that.customFooter = false;
            }
            if (hasHeader && hasHeader.toLowerCase() === "none") {
                that.toggleHeaderMenu(false);
                hasHeader=false;
            } else {
                that.toggleHeaderMenu(true);
            }

            if (hasHeader && that.customHeader !== hasHeader) {
                that.customHeader = hasHeader;
                that.updateHeaderElements(hasHeader, goBack);
            } else if (hasHeader !== that.customHeader) {
                if (that.customHeader) {
                    that.updateHeaderElements(that.defaultHeader, goBack);
                    //that.setTitle(that.activeDiv.title);
                }
                that.customHeader = false;
            }

            //Load inline footers
            var inlineFooters = $(what).find("footer");
            if (inlineFooters.length > 0) {
                that.customFooter = what.id;
                inlineFooters.data("parent", what.id);
                that.updateNavbarElements(inlineFooters);
            }
            //load inline headers
            var inlineHeader = $(what).find("header");


            if (inlineHeader.length > 0) {
                that.customHeader = what.id;
                inlineHeader.data("parent", what.id);
                that.updateHeaderElements(inlineHeader, goBack);
            }
            //check if the panel has a footer
            if (what.getAttribute("data-tab")) { //Allow the dev to force the footer menu
                $.query("#navbar>footer>a:not(.button)").removeClass("pressed");
                $.query("#navbar #" + what.getAttribute("data-tab")).addClass("pressed");
            }

            var hasMenu = what.getAttribute("data-left-menu")||what.getAttribute("data-nav");
            if (hasMenu && this.customMenu !== hasMenu) {
                this.customMenu = hasMenu;
                this.updateSideMenuElements(hasMenu);
            } else if (hasMenu !== this.customMenu) {
                if (this.customMenu) {
                    this.updateSideMenuElements(this.defaultMenu);
                }
                this.customMenu = false;
            }


            var hasAside =what.getAttribute("data-right-menu")|| what.getAttribute("data-aside");
            if(hasAside && this.customAside !== hasAside){
                this.customAside= hasAside;
                this.updateAsideElements(hasAside);
            }
            else if(hasAside !== this.customAside) {
                if(this.customAside){
                    this.updateAsideElements(this.defaultAside);
                }
                this.customAside=false;
            }


            if (oldDiv) {
                fnc = oldDiv.getAttribute("data-unload");
                if(fnc)
                    this.dispatchPanelEvent(fnc,oldDiv);
                $(oldDiv).trigger("unloadpanel");
            }
            var fnc = what.getAttribute("data-load");
            if(fnc)
                this.dispatchPanelEvent(fnc,what);
            $(what).trigger("loadpanel");
            if (this.isSideMenuOn()) {
                that.toggleSideMenu(false);
            }
        },
        /**
         * Helper function that parses a contents html for any script tags and either adds them or executes the code
         * @api private
         */
        parseScriptTags: function(div) {
            if (!div) return;
            if(!$.fn||$.fn.namespace!=="appframework") return;

            $.parseJS(div);
        },
        /**
         * This is called to initiate a transition or load content via ajax.
         * We can pass in a hash+id or URL and then we parse the panel for additional functions
           ```
           $.ui.loadContent("#main",false,false,"up");
           ```
         * @param {string} target
         * @param {boolean=} newtab (resets history)
         * @param {boolean=} go back (initiate the back click)
         * @param {string=} transition
         * @param {object=} anchor
         * @title $.ui.loadContent(target, newTab, goBack, transition, anchor);
         * @api public
         */
        loadContent: function(target, newTab, back, transition, anchor) {

            if (this.doingTransition) {
                this.loadContentQueue.push([target, newTab, back, transition, anchor]);
                return;
            }
            if (target.length === 0) return;


            var loadAjax = true;
            anchor = anchor || document.createElement("a"); //Hack to allow passing in no anchor
            if (target.indexOf("#") === -1) {
                var urlHash = "url" + crc32(target); //Ajax urls
                var crcCheck = $.query("div.panel[data-crc='" + urlHash + "']");
                if ($.query("#" + target).length > 0) {
                    loadAjax = false;
                } else if (crcCheck.length > 0) {
                    loadAjax = false;
                    if (anchor.getAttribute("data-refresh-ajax") === "true" || (anchor.refresh && anchor.refresh === true || this.isAjaxApp)) {
                        loadAjax = true;
                    } else {
                        target = "#" + crcCheck.get(0).id;
                    }
                } else if ($.query("#" + urlHash).length > 0) {

                    //ajax div already exists.  Let's see if we should be refreshing it.
                    loadAjax = false;
                    if (anchor.getAttribute("data-refresh-ajax") === "true" || (anchor.refresh && anchor.refresh === true || this.isAjaxApp)) {
                        loadAjax = true;
                    } else target = "#" + urlHash;
                }
            }
            if (target.indexOf("#") === -1 && loadAjax) {
                this.loadAjax(target, newTab, back, transition, anchor);
            } else {
                this.loadDiv(target, newTab, back, transition);
            }
        },
        /**
         * This is called internally by loadContent.  Here we are loading a div instead of an Ajax link
           ```
           $.ui.loadDiv("#main",false,false,"up");
           ```
         * @param {string} target
         * @param {boolean=} newtab (resets history)
         * @param {boolean=} back Go back (initiate the back click)
         * @param {string=} transition
         * @title $.ui.loadDiv(target,newTab,goBack,transition);
         * @api private
         */
        loadDiv: function(target, newTab, back, transition) {
            // load a div
            var that = this;
            var what = target.replace("#", "");

            var slashIndex = what.indexOf("/");
            var hashLink = "";
            if (slashIndex !== -1) {
                // Ignore everything after the slash for loading
                hashLink = what.substr(slashIndex);
                what = what.substr(0, slashIndex);
            }

            what = $.query("#" + what).get(0);

            if (!what) {
                $(document).trigger("missingpanel", null, {missingTarget: target});
                return;
            }
            if (what === this.activeDiv && !back) {
                //toggle the menu if applicable
                if (this.isSideMenuOn()) this.toggleSideMenu(false);
                return;
            }
            this.transitionType = transition;
            var oldDiv = this.activeDiv;
            var currWhat = what;

            if (what.getAttribute("data-modal") === "true" || what.getAttribute("modal") === "true") {
                return this.showModal(what.id);
            }



            if (oldDiv === currWhat) //prevent it from going to itself
                return;

            if (newTab) {
                this.clearHistory();
                this.pushHistory("#" + this.firstDiv.id, what.id, transition, hashLink);
            } else if (!back) {
                this.pushHistory(previousTarget, what.id, transition, hashLink);
            }


            previousTarget = "#" + what.id + hashLink;


            this.doingTransition = true;
            oldDiv.style.display = "block";
            currWhat.style.display = "block";

            this.runTransition(transition, oldDiv, currWhat, back);


            //Let's check if it has a function to run to update the data
            this.parsePanelFunctions(what, oldDiv, back);
            //Need to call after parsePanelFunctions, since new headers can override
            this.loadContentData(what, newTab, back, transition);

            //this fixes a bug in iOS where a div flashes when the the overflow property is changed from auto to hidden
            if($.feat.nativeTouchScroll) {
                setTimeout(function() {
                    if (that.scrollingDivs[oldDiv.id]) {
                        that.scrollingDivs[oldDiv.id].disable();
                    }
                }, numOnly(that.transitionTime) + 50);
            }
            else if (typeof that.scrollingDivs[oldDiv.id] !== "undefined")
                that.scrollingDivs[oldDiv.id].disable();

        },
        /**
         * This is called internally by loadDiv.  This sets up the back button in the header and scroller for the panel
           ```
           $.ui.loadContentData("#main",false,false,"up");
           ```
         * @param {string} target
         * @param {boolean=} newtab (resets history)
         * @param {boolean=} go back (initiate the back click)
         * @title $.ui.loadContentData(target,newTab,goBack);
         * @api private
         */
        loadContentData: function(what, newTab, back) {

            var prevId, el, val, slashIndex;
            if (back) {
                if (this.history.length > 0) {
                    val = this.history[this.history.length - 1];
                    slashIndex = val.target.indexOf("/");
                    if (slashIndex !== -1) {
                        prevId = val.target.substr(0, slashIndex);
                    } else prevId = val.target;
                    el = $.query(prevId).get(0);
                    //make sure panel is there
                    if (el) this.setBackButtonText(el.getAttribute("data-title"));
                    else this.setBackButtonText("Back");
                }
            } else if (this.activeDiv.getAttribute("data-title")) this.setBackButtonText(this.activeDiv.getAttribute("data-title"));
            else this.setBackButtonText("Back");
            if (what.getAttribute("data-title")) {
                this.setTitle(what.getAttribute("data-title"));
            }
            if (newTab) {
                this.setBackButtonText(this.firstDiv.getAttribute("data-title"));
                if (what === this.firstDiv) {
                    this.history.length = 0;
                }
            }

            $("#header #menubadge").css("float", "right");
            if (this.history.length === 0) {
                this.setBackButtonVisibility(false);
                this.history = [];
                $("#header #menubadge").css("float", "left");
            } else {
                this.setBackButtonVisibility( this.showBackButton && this.showBackbutton );
            }
            this.activeDiv = what;
            if (this.scrollingDivs[this.activeDiv.id]) {
                this.scrollingDivs[this.activeDiv.id].enable(this.resetScrollers);
            }
        },
        /**
         * This is called internally by loadContent.  Here we are using Ajax to fetch the data
           ```
           $.ui.loadDiv("page.html",false,false,"up");
           ```
         * @param {string} target
         * @param {boolean=} newtab (resets history)
         * @param {boolean=} go back (initiate the back click)
         * @param {string=} transition
         * @param {object=} anchor
         * @title $.ui.loadDiv(target,newTab,goBack,transition);
         * @api private
         */
        loadAjax: function(target, newTab, back, transition, anchor) {
            // XML Request
            if (this.activeDiv.id === "afui_ajax" && target === this.ajaxUrl) return;
            var urlHash = "url" + crc32(target); //Ajax urls
            var that = this;
            if (target.indexOf("http") === -1) target = intel.xdk.webRoot + target;
            var xmlhttp = new XMLHttpRequest();

            if (anchor && typeof(anchor) !== "object") {
                anchor = document.createElement("a");
                anchor.setAttribute("data-persist-ajax", true);
            }

            anchor = anchor || document.createElement("a");
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                    this.doingTransition = false;
                    var refreshFunction;
                    var doReturn = false;
                    var retainDiv = $.query("#" + urlHash);
                    //Here we check to see if we are retaining the div, if so update it
                    if (retainDiv.length > 0) {
                        that.updatePanel(urlHash, xmlhttp.responseText);
                        retainDiv.get(0).setAttribute("data-title",anchor.title ? anchor.title : target);
                    } else if (anchor.getAttribute("data-persist-ajax") || that.isAjaxApp) {

                        var refresh = (anchor.getAttribute("data-pull-scroller") === "true") ? true : false;
                        refreshFunction = refresh ? function() {
                            anchor.refresh = true;
                            that.loadContent(target, newTab, back, transition, anchor);
                            anchor.refresh = false;
                        } : null;
                        //that.addContentDiv(urlHash, xmlhttp.responseText, refresh, refreshFunction);
                        var contents = $(xmlhttp.responseText);

                        if (contents.hasClass("panel"))
                        {
                            urlHash=contents.attr("id");
                            contents = contents.get(0).innerHTML;
                        }
                        else
                            contents = contents.html();
                        if ($("#" + urlHash).length > 0) {
                            that.updatePanel("#" + urlHash, contents);
                        } else if ($("div.panel[data-crc='" + urlHash + "']").length > 0) {
                            that.updatePanel($("div.panel[data-crc='" + urlHash + "']").get(0).id, contents);
                            urlHash = $("div.panel[data-crc='" + urlHash + "']").get(0).id;
                        } else
                            urlHash = that.addContentDiv(urlHash, xmlhttp.responseText, anchor.title ? anchor.title : target, refresh, refreshFunction);
                    } else {

                        that.updatePanel("afui_ajax", xmlhttp.responseText);
                        $.query("#afui_ajax").attr("data-title",anchor.title ? anchor.title : target);
                        that.loadContent("#afui_ajax", newTab, back, transition);

                        doReturn = true;
                    }
                    //Let's load the content now.
                    //We need to check for any script tags and handle them
                    var div = document.createElement("div");
                    $(div).html(xmlhttp.responseText);

                    that.parseScriptTags(div);

                    if (doReturn) {
                        if (that.showLoading) that.hideMask();
                        return;
                    }

                    that.loadContent("#" + urlHash, newTab, back, transition);
                    if (that.showLoading) that.hideMask();
                    return null;
                }
                else if(xmlhttp.readyState === 4) {
                    $.ui.hideMask();
                }
            };
            this.ajaxUrl = target;
            var newtarget = this.useAjaxCacheBuster ? target + (target.split("?")[1] ? "&" : "?") + "cache=" + Math.random() * 10000000000000000 : target;
            xmlhttp.open("GET", newtarget, true);
            xmlhttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            xmlhttp.send();
            // show Ajax Mask
            if (this.showLoading) this.showMask();
        },
        /**
         * This executes the transition for the panel
            ```
            $.ui.runTransition(transition,oldDiv,currDiv,back)
            ```
         * @api private
         * @title $.ui.runTransition(transition,oldDiv,currDiv,back)
         */
        runTransition: function(transition, oldDiv, currWhat, back) {
            if (!this.availableTransitions[transition]) transition = "default";
            if(oldDiv.style.display==="none")
                oldDiv.style.display = "block";
            if(currWhat.style.display==="none")
                currWhat.style.display = "block";
            this.availableTransitions[transition].call(this, oldDiv, currWhat, back);
        },

        /**
         * This is callled when you want to launch afui.  If autoLaunch is set to true, it gets called on DOMContentLoaded.
         * If autoLaunch is set to false, you can manually invoke it.
           ```
           $.ui.autoLaunch=false;
           $.ui.launch();
           ```
         * @title $.ui.launch();
         */
        launch: function() {

            if (this.hasLaunched === false || this.launchCompleted) {
                this.hasLaunched = true;
                return;
            }
            if(this.isLaunching)
                return true;
            this.isLaunching=true;

            var that = this;

            this.viewportContainer = af.query("#afui");
            this.navbar = af.query("#navbar").get(0);
            this.content = af.query("#content").get(0);
            this.header = af.query("#header").get(0);
            this.menu = af.query("#menu").get(0);
            //set anchor click handler for UI
            this.viewportContainer.on("click", "a", function(e) {
                if(that.useInternalRouting)
                    checkAnchorClick(e, e.currentTarget);
            });


            //enter-edit scroll paddings fix
            //focus scroll adjust fix
            var enterEditEl = null;

            //on enter-edit keep a reference of the actioned element
            $.bind($.touchLayer, "enter-edit", function(el) {
                enterEditEl = el;
            });
            //enter-edit-reshape panel padding and scroll adjust
            if($.os.android&&!$.os.androidICS)
            {
                $.bind($.touchLayer, "enter-edit-reshape", function() {
                    //onReshape UI fixes
                    //check if focused element is within active panel
                    var jQel = $(enterEditEl);
                    var jQactive = jQel.closest(that.activeDiv);
                    if (jQactive && jQactive.size() > 0) {
                        var elPos = jQel.offset();
                        var containerPos = jQactive.offset();
                        if (elPos.bottom > containerPos.bottom && elPos.height < containerPos.height) {
                            //apply fix
                            that.scrollingDivs[that.activeDiv.id].scrollToItem(jQel, "bottom");
                        }
                    }
                });
                $.bind($.touchLayer, "exit-edit-reshape", function() {
                    if (that.activeDiv && that.activeDiv.id && that.scrollingDivs.hasOwnProperty(that.activeDiv.id)) {
                        that.scrollingDivs[that.activeDiv.id].setPaddings(0, 0);
                    }
                });
            }

            //elements setup
            if (!this.navbar) {
                this.navbar = $.create("div", {
                    id: "navbar"
                }).get(0);
                this.viewportContainer.append(this.navbar);
            }
            if (!this.header) {
                this.header = $.create("div", {
                    id: "header"
                }).get(0);
                this.viewportContainer.prepend(this.header);
            }

            if (!this.content) {
                this.content = $.create("div", {
                    id: "content"
                }).get(0);
                $(this.content).insertAfter(this.header);
            }
            if (!this.menu) {
                this.menu = $.create("div", {
                    id: "menu",
                    html: "<div id='menu_scroller'></div>"
                }).get(0);
                this.viewportContainer.append(this.menu);
                this.menu.style.overflow = "hidden";
                this.scrollingDivs.menu_scroller = $.query("#menu_scroller").scroller({
                    scrollBars: true,
                    verticalScroll: true,
                    vScrollCSS: "afScrollbar",
                    useJsScroll: !$.feat.nativeTouchScroll,
                    autoEnable: true,
                    lockBounce: this.lockPageBounce,
                    hasParent:true
                });
                if ($.feat.nativeTouchScroll) $.query("#menu_scroller").css("height", "100%");

                this.asideMenu = $.create("div", {
                    id: "aside_menu",
                    html: "<div id='aside_menu_scroller'></div>"
                }).get(0);
                this.viewportContainer.append(this.asideMenu);
                this.asideMenu.style.overflow = "hidden";
                this.scrollingDivs.aside_menu_scroller = $.query("#aside_menu_scroller").scroller({
                    scrollBars: true,
                    verticalScroll: true,
                    vScrollCSS: "afScrollbar",
                    useJsScroll: !$.feat.nativeTouchScroll,
                    autoEnable: true,
                    lockBounce: this.lockPageBounce,
                    hasParent:true
                });
                if ($.feat.nativeTouchScroll) $.query("#aside_menu_scroller").css("height", "100%");
            }



            //insert backbutton (should optionally be left to developer..)
            $(this.header).html("<a class='backButton button'></a> <h1 id='pageTitle'></h1>" + this.header.innerHTML);
            this.backButton = $.query("#header .backButton").css("visibility", "hidden");
            $(document).on("click", "#header .backButton", function(e) {
                e.preventDefault();
                that.goBack();
            });

            //page title (should optionally be left to developer..)
            this.titlebar = $.query("#header #pageTitle").get(0);

            //setup ajax mask
            this.addContentDiv("afui_ajax", "");
            var maskDiv = $.create("div", {
                id: "afui_mask",
                className: "ui-loader",
                html: "<span class='ui-icon ui-icon-loading spin'></span><h1>Loading Content</h1>"
            }).css({
                "z-index": 20000,
                display: "none"
            });
            document.body.appendChild(maskDiv.get(0));
            //setup modalDiv
            var modalDiv = $.create("div", {
                id: "afui_modal"
            }).get(0);
            $(modalDiv).hide();
            modalDiv.appendChild($.create("div",{
                id:"modalHeader",
                className:"header"
            }).get(0));
            modalDiv.appendChild($.create("div", {
                id: "modalContainer"
            }).get(0));
            modalDiv.appendChild($.create("div",{
                id:"modalFooter",
                className:"footer"
            }).get(0));

            this.modalTransContainer = $.create("div", {
                id: "modalTransContainer"
            }).appendTo(modalDiv).get(0);
            this.viewportContainer.append(modalDiv);
            this.scrollingDivs.modal_container = $.query("#modalContainer").scroller({
                scrollBars: true,
                vertical: true,
                vScrollCSS: "afScrollbar",
                lockBounce: this.lockPageBounce
            });
            this.modalWindow = modalDiv;
            //get first div, defer
            var defer = {};
            var contentDivs = this.viewportContainer.get(0).querySelectorAll(".panel");


            for (var i = 0; i < contentDivs.length; i++) {
                var el = contentDivs[i];
                var tmp = el;
                var prevSibling = el.previousSibling;
                if (el.parentNode && el.parentNode.id !== "content") {
                    if (tmp.getAttribute("selected")) this.firstDiv = el;
                    this.addDivAndScroll(tmp);
                    $.query("#content").append(el);
                } else if (!el.parsedContent) {
                    el.parsedContent = 1;
                    if (tmp.getAttribute("selected")) this.firstDiv = el;
                    this.addDivAndScroll(el);
                    $(el).insertAfter(prevSibling);
                }
                if (el.getAttribute("data-defer")) {
                    defer[el.id] = el.getAttribute("data-defer");
                }
                if (!this.firstDiv) this.firstDiv = el;
                el = null;
            }

            contentDivs = null;
            var loadingDefer = false;
            var toLoad = Object.keys(defer).length;
            var loadDeferred=function(j){
                $.ajax({
                    url: intel.xdk.webRoot + defer[j],
                    success: function(data) {
                        if (data.length > 0) {
                            that.updatePanel(j, data);
                            that.parseScriptTags($.query("#" + j).get(0));
                        }
                        loaded++;
                        if (loaded >= toLoad) {
                            loadingDefer = false;
                            $(document).trigger("defer:loaded");
                        }
                    },
                    error: function() {
                        //still trigger the file as being loaded to not block $.ui.ready
                        console.log("Error with deferred load " + intel.xdk.webRoot + defer[j]);
                        loaded++;
                        if (loaded >= toLoad) {
                            loadingDefer = false;
                            $(document).trigger("defer:loaded");
                        }
                    }
                });
            };
            if (toLoad > 0) {
                loadingDefer = true;
                var loaded = 0;
                for (var j in defer) {
                    loadDeferred(j);
                }
            }
            if (this.firstDiv) {
                this.activeDiv = this.firstDiv;
                if (this.scrollingDivs[this.activeDiv.id]) {
                    this.scrollingDivs[this.activeDiv.id].enable();
                }

                var loadFirstDiv = function() {


                    $.query("#navbar").append($.create("footer", {
                        id: "defaultNav"
                    }).append($.query("#navbar").children()));
                    that.defaultFooter = "defaultNav";
                    that.prevFooter = $.query("#defaultNav");
                    that.updateNavbarElements(that.prevFooter);
                    //setup initial menu
                    var firstMenu = $.query("nav").get(0);
                    if (firstMenu) {
                        that.defaultMenu = $(firstMenu);
                        that.updateSideMenuElements(that.defaultMenu);
                        that.prevMenu = that.defaultMenu;
                    }
                    var firstAside = $.query("aside").get(0);
                    if(firstAside) {
                        that.defaultAside=$(firstAside);
                        that.updateAsideElements(that.defaultAside);
                        that.prevAsideMenu=that.defaultAside;
                    }
                    //get default header
                    that.defaultHeader = "defaultHeader";
                    $.query("#header").append($.create("header", {
                        id: "defaultHeader"
                    }).append($.query("#header").children()));
                    that.prevHeader = $.query("#defaultHeader");
                    $.query("#header").addClass("header");
                    $.query("#navbar").addClass("footer");
                    //
                    $.query("#navbar").on("click", "footer>a:not(.button)", function(e) {
                        $.query("#navbar>footer>a").not(e.currentTarget).removeClass("pressed");
                        $(e.currentTarget).addClass("pressed");
                    });

                    //There is a bug in chrome with @media queries where the header was not getting repainted
                    if ($.query("nav").length > 0) {
                        var splitViewClass=that.splitview?" splitview":"";
                        $.query("#afui #header").addClass("hasMenu"+splitViewClass);
                        $.query("#afui #content").addClass("hasMenu"+splitViewClass);
                        $.query("#afui #navbar").addClass("hasMenu"+splitViewClass);
                        $.query("#afui #menu").addClass("hasMenu"+splitViewClass);
                        $.query("#afui #aside_menu").addClass(splitViewClass);
                    }
                    if($.query("aside").length > 0) {
                        $.query("#afui #header, #afui #content, #afui #navbar").addClass("hasAside");
                    }
                    $.query("#afui #menu").addClass("tabletMenu");
                    //go to activeDiv


                    if($.ui.splitview&&window.innerWidth>parseInt($.ui.handheldMinWidth,10)){
                        $.ui.sideMenuWidth=$("#menu").css("width")+"px";
                    }

                    var firstPanelId = that.getPanelId(defaultHash);
                    //that.history=[{target:'#'+that.firstDiv.id}];   //set the first id as origin of path
                    var isFirstPanel = (firstPanelId!==null&&firstPanelId === "#" + that.firstDiv.id);
                    if (firstPanelId.length > 0 && that.loadDefaultHash && !isFirstPanel) {
                        that.loadContent(defaultHash, true, false, "none"); //load the active page as a newTab with no transition
                    }

                    else {
                        previousTarget = "#" + that.firstDiv.id;

                        that.firstDiv.style.display = "block";
                        //Let's check if it has a function to run to update the data
                        that.parsePanelFunctions(that.firstDiv);
                        //Need to call after parsePanelFunctions, since new headers can override
                        that.loadContentData(that.firstDiv);

                        $.query("#header .backButton").css("visibility", "hidden");
                        if (that.firstDiv.getAttribute("data-modal") === "true" || that.firstDiv.getAttribute("modal") === "true") {
                            that.showModal(that.firstDiv.id);
                        }
                    }

                    that.launchCompleted = true;
                    //trigger ui ready
                    $.query("#afui #splashscreen").remove();
                    if($.os.fennec){
                        $(document).trigger("afui:ready");
                    }
                    else
                        setTimeout(function(){
                            $(document).trigger("afui:ready");
                        });
                };
                if (loadingDefer) {
                    $(document).one("defer:loaded", loadFirstDiv);
                } else loadFirstDiv();
            }
            else {
                //Don't block afui:ready from dispatching, even though there's no content
                setTimeout(function(){
                        $(document).trigger("afui:ready");
                    });
            }
            $.bind(that, "content-loaded", function() {
                if (that.loadContentQueue.length > 0) {
                    var tmp = that.loadContentQueue.splice(0, 1)[0];
                    that.loadContent(tmp[0], tmp[1], tmp[2], tmp[3], tmp[4]);
                }
            });
            if (window.navigator.standalone||this.isIntel) {
                this.blockPageScroll();
            }
            this.enableTabBar();
            this.topClickScroll();
        },
        /**
         * This simulates the click and scroll to top of browsers
         */
        topClickScroll: function() {
            var that = this;
            document.getElementById("header").addEventListener("click", function(e) {
                if (e.clientY <= 15 && e.target.nodeName.toLowerCase() === "h1") //hack - the title spans the whole width of the header
                    that.scrollingDivs[that.activeDiv.id].scrollToTop("100");
            });

        },
        /**
         * This blocks the page from scrolling/panning.  Usefull for native apps
         */
        blockPageScroll: function() {
            $.query("#afui #header").bind("touchmove", function(e) {
                e.preventDefault();
            });
        },
        /**
         * This is the default transition.  It simply shows the new panel and hides the old
         */
        noTransition: function(oldDiv, currDiv) {
            currDiv.style.display = "block";
            oldDiv.style.display = "block";
            var that = this;
            that.clearAnimations(currDiv);
            that.css3animate(oldDiv, {
                x: "0%",
                y: 0
            });
            that.finishTransition(oldDiv);
            currDiv.style.zIndex = 2;
            oldDiv.style.zIndex = 1;
        },
        /**
         * This must be called at the end of every transition to hide the old div and reset the doingTransition variable
         *
         * @param {object} oldDiv Div that transitioned out
         * @param {object=} currDiv 
         * @title $.ui.finishTransition(oldDiv)
         */
        finishTransition: function(oldDiv, currDiv) {
            oldDiv.style.display = "none";
            this.doingTransition = false;
            if(oldDiv)
                $(oldDiv).trigger("unloadpanelcomplete");
            if(currDiv)
                $(currDiv).trigger("loadpanelcomplete");

            if (currDiv) this.clearAnimations(currDiv);
            if (oldDiv) this.clearAnimations(oldDiv);
            $.trigger(this, "content-loaded");
        },

        /**
         * This must be called at the end of every transition to remove all transforms and transitions attached to the inView object (performance + native scroll)
         *
         * @param {object} inViewDiv Div that transitioned out
         * @title $.ui.finishTransition(oldDiv)
         */
        clearAnimations: function(inViewDiv) {
            inViewDiv.style[$.feat.cssPrefix + "Transform"] = "none";
            inViewDiv.style[$.feat.cssPrefix + "Transition"] = "none";
        }

        /**
         * END
         * @api private
         */
    };


    //lookup for a clicked anchor recursively and fire UI own actions when applicable
    var checkAnchorClick = function(e, theTarget) {
        var afui = document.getElementById("afui");
        if (theTarget === (afui)) {
            return;
        }

        //this technique fails when considerable content exists inside anchor, should be recursive ?
        if (theTarget.tagName.toLowerCase() !== "a" && theTarget.parentNode) return checkAnchorClick(e, theTarget.parentNode); //let's try the parent (recursive)
        //anchors
        if (theTarget.tagName !== "undefined" && theTarget.tagName.toLowerCase() === "a") {

            var custom = (typeof $.ui.customClickHandler === "function") ? $.ui.customClickHandler : false;
            if (custom !== false) {
                if ($.ui.customClickHandler(theTarget,e)) return e.preventDefault();

            }
            if (theTarget.href.toLowerCase().indexOf("javascript:") !== -1 || theTarget.getAttribute("data-ignore")) {
                return;
            }


            //external links
            if (theTarget.hash.indexOf("#") === -1 && theTarget.target.length > 0) {
                if (theTarget.href.toLowerCase().indexOf("javascript:") !== 0) {
                    if ($.ui.isIntel) {
                        e.preventDefault();
                        intel.xdk.device.launchExternal(theTarget.href);
                    } else if (!$.os.desktop) {
                        e.target.target = "_blank";
                    }
                }
                return;
            }

            /* IE 10 fixes*/

            var href = theTarget.href,
                prefix = location.protocol + "//" + location.hostname + ":" + location.port + location.pathname;
            if (href.indexOf(prefix) === 0) {
                href = href.substring(prefix.length);
            }
            //empty links
            if (href === "#" || (href.indexOf("#") === href.length - 1) || (href.length === 0 && theTarget.hash.length === 0)) return e.preventDefault();

            //internal links
            //http urls
            var urlRegex=/^((http|https|file):\/\/)/;
            //only call prevent default on http/fileurls.  If it's a protocol handler, do not call prevent default.
            //It will fall through to the ajax call and fail
            if(theTarget.href.indexOf(":") !== -1 &&urlRegex.test(theTarget.href))
                e.preventDefault();
            var mytransition = theTarget.getAttribute("data-transition");
            var resetHistory = theTarget.getAttribute("data-resetHistory");
            resetHistory = resetHistory && resetHistory.toLowerCase() === "true" ? true : false;
            href = theTarget.hash.length > 0 ? theTarget.hash : href;
            $.ui.loadContent(href, resetHistory, 0, mytransition, theTarget);
            return;
        }
    };

    var table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D"; /* Number */
    var crc32 = function( /* String */ str, /* Number */ crc) {
        if (crc === undefined) crc = 0;
        var n = 0; //a number between 0 and 255
        var x = 0; //an hex number
        crc = crc ^ (-1);
        for (var i = 0, iTop = str.length; i < iTop; i++) {
            n = (crc ^ str.charCodeAt(i)) & 0xFF;
            x = "0x" + table.substr(n * 9, 8);
            crc = (crc >>> 8) ^ x;
        }
        return (crc ^ (-1))>>>0;
    };

    $.ui = new ui();
    $.ui.init=true;
    $(window).trigger("afui:preinit");
    $(window).trigger("afui:init");
})(af);


//The following functions are utilitiy functions for afui within intel xdk.

(function($) {
    "use strict";
    var xdkDeviceReady=function(){
        $.ui.isIntel=true;
        setTimeout(function() {
            document.getElementById("afui").style.height = "100%";
            document.body.style.height = "100%";
            document.documentElement.style.minHeight = window.innerHeight;
        }, 30);
        document.removeEventListener("intel.xdk.device.ready",xdkDeviceReady);
    };
    document.addEventListener("intel.xdk.device.ready",xdkDeviceReady);
    //Fix an ios bug where scrolling will not work with rotation
    if ($.feat.nativeTouchScroll) {
        document.addEventListener("orientationchange", function() {
            if ($.ui.scrollingDivs[$.ui.activeDiv.id]) {
                var tmpscroller = $.ui.scrollingDivs[$.ui.activeDiv.id];
                if(!tmpscroller) return;
                if (tmpscroller.el.scrollTop === 0) {
                    tmpscroller.disable();
                    setTimeout(function() {
                        tmpscroller.enable();
                    }, 300);
                }
                if(tmpscroller.refresh)
                    tmpscroller.updateP2rHackPosition();
            }
        });
    }
})(af);
