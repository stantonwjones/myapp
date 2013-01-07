(function() {
    var guideIds = [
        "b995492d5e7943e3b2757a88fe3ef7c6",
        "0bed6fee853b4f4e966cec0f1210079d"
    ];

    // keep track of the last open modal.  Ideally would store objects in a designated
    // global APP object
    var currentlyOpenPreview;
    
    // initialize the template variables
    var galleryThumbItemTemplate;
    var galleryModalTemplate;
    var galleryListItemTemplate;
    var galleryPreviewTemplate;

    // initialize the gallery list once the page is loaded
    window.onload = setup;

    // Sets up the application: sets template variables and populates the gallery list
    function setup() {
        galleryThumbItemTemplate = new Template('galleryThumbItem');
        galleryModalTemplate = new Template('galleryModal');
        galleryListItemTemplate = new Template('galleryListItem');
        galleryPreviewTemplate = new Template('galleryPreview');

        initGalleryList();
    }

    /**
     *  initialize the gallery list
     *
     *  Retrieves each gallery as defined by the snapguid galleryIds hash and populates
     *  the list with an animated gif.  Once the data is loaded, the gifs are replaced
     *  with the actual list item.
     */
    function initGalleryList() {

        var galleryListContainer = document.getElementById('galleryList');
        var listRows = [];

        for (var i = 0; i < guideIds.length; i ++) {
            var galleryListRow = document.createElement('div');
            galleryListRow.className = "gallery-list-row " + guideIds[i];
            galleryListContainer.appendChild( galleryListRow );

            getGuideData( guideIds[i], function( data ) {
                var templateData = {
                    author: data.guide.author.name,
                    title: data.guide.metadata.title,
                    //source: smallImageUrl( imageIds[0] ),
                    imageIds: getImageIds(data.guide)
                };
                var container = document.getElementsByClassName(data.guide.uuid)[0];
                new GalleryListItem( container, templateData );
            });
        }

        function getImageIds( guideData ) {
            var imageIds = [];

            for ( var i in guideData.media ) {
                if ( !guideData.media.hasOwnProperty(i) ) continue;
                if ( guideData.media[i].type != "guide_image") continue;
                imageIds.push( i );
            }
            return imageIds;
        }
    }
    
    /**
     *  Retrieves the JSON Data from the backend proxy
     *  TODO: for robustness in production, an error callback function would also exist
     *  
     *  @param {string}   sgId  the uuid for the snapguide object
     *  @param {function} callback the callback function to call once the data is
                                    successfully retrieved.  Else an error is raised.
                                    The successfully parsed JSON is passed as an argument 
                                    to the callback function.
     *
     */
    function getGuideData( sgId, callback ) {
        var guideUri = '/snapguide/guide/' + sgId;
        getData( guideUri, callback );
    }

    /**
     *  Retrieves JSON Data from the given url and passes it to the callback function
     *  on success.
     *
     *  @param {string}     url     the url for the JSON data
     *  @param {function}   callback    the callback function
     */
    function getData(url, callback) {

        var req = new XMLHttpRequest();
        req.open("get", url, true);

        req.onreadystatechange = function (oEvent) {
            if (req.readyState === 4) {
                if (req.status === 200) {
                    callback( JSON.parse(req.responseText) );
                } else {
                    console.log("Error", req.statusText);
                }
            }
        };

        req.send();

    }

    // Get the snapguide thumbnail image url for a given image uuid
    function smallImageUrl( sgId ) {
        return 'http://images.snapguide.com/images/guide/' + sgId + '/60x60_ac.jpg';
    }

    // Get the medium snapguide image url for a given image uuid
    function bigImageUrl( sgId ) {
        //return 'http://images.snapguide.com/images/guide/' + sgId + '/300x294_ac.jpg';
        return 'http://images.snapguide.com/images/guide/' + sgId + '/original.jpg';
    }

    /**
     *  The template object defined by the given name
     *
     *  @param {string} name    the name of the template
     */
    function Template( name ) {

        // Find the template of the given name and raise an error if it is not found
        var templateTag = document.getElementsByName(name)[0];
        if ( !templateTag) throw name + ' template not found';
        var template = templateTag.innerHTML;

        // get the values the template expects to be replaced when processed
        var properties = templateTag.getAttribute('data-properties').split(' ');

        /** 
         *  Process the template according to the given params object
         *  and returns the rendered sting
         */
        this.render = function( params ) {
            if ( !params ) {
                return template;
            }
            var temp;
            for ( var i = 0; i < properties.length; i++ ) {
                // set the key to use and the flag to replace
                var prop = properties[i];
                var flag = '#' + prop + '#';
                
                // replace the items in the template
                if ( !temp ) {
                    temp = template.replace( flag, params[prop] );
                } else {
                    temp = temp.replace( flag, params[prop] );
                }
            }
            return temp;
        }
    }
    
    function GalleryListItem( container, data ) {
        var self = this;
        // data is the full JSON object recieved from the api
        var imageIds = data.imageIds;
        var previewOpen = false;

        // store reference to the DOM object associated with this object
        var tempElem = document.createElement('div');
        tempElem.innerHTML = galleryListItemTemplate.render( data );
        this.elem = tempElem.children[0];

        // store reference to the preview button
        this.previewBtn = this.elem.getElementsByClassName('preview-btn')[0];

        // store author and title for use by modal object
        this.author = data.author;
        this.title = data.title;

        var previewContainer = this.elem.getElementsByClassName('preview-container')[0];
        var modalContainer = document.getElementById( 'modalContainer' );
        
        // store preview and modal objects as local and instance variables
        // local variable for references in event listeners
        this.preview =  new GalleryPreview( this, previewContainer, imageIds );
        this.modal = new GalleryModal( this, modalContainer, imageIds );
        this.thumb = new GalleryThumb( this, imageIds[0], 0);

        this.render = function() {
            // clear the html from the inside of the container
            container.innerHTML = '';
            container.appendChild( this.elem );
            container.className = container.className + ' loaded';
            // set the thumb image for this gallery
            var thumbContainer = this.elem.getElementsByClassName('gallery-thumb-container')[0];
            this.thumb.render( thumbContainer, true );
            this.registerEventListeners();
        };

        this.registerEventListeners = function() {
            var previewButton = this.elem.getElementsByClassName('preview-btn')[0];
            previewButton.addEventListener('click', this.openOrClosePreview, false);
        };

        this.openOrClosePreview = function() {
            if (!previewOpen) {
                self.previewBtn.innerHTML = 'close';
                self.preview.open();
            } else {
                self.previewBtn.innerHTML = 'preview';
                self.preview.close();
            }
            previewOpen = previewOpen ? false : true;
        };

        // render the GalleryListItem
        this.render();
    }
    
    function GalleryModal( gallery, container, imageIds ) {
        //var template = galleryModalTemplate;
        var pageIndex = 0;
        var self = this;
        
        this.render = function() {
            var params = {
                author: gallery.author,
                title: gallery.title,
                source: bigImageUrl( imageIds[ pageIndex ] )
            }
            container.innerHTML = galleryModalTemplate.render(params);
            this.registerEventListeners();
        }

        this.registerEventListeners = function() {
            var prevButton = container.getElementsByClassName('prev')[0];
            var nextButton = container.getElementsByClassName('next')[0];
            var closeButton = container.getElementsByClassName('close')[0];
            prevButton.addEventListener('click', this.prev, false);
            nextButton.addEventListener('click', this.next, false);
            closeButton.addEventListener('click', this.close, false);
        };

        // Closess the modal
        this.close = function() {
            container.style.opacity = '0';
            window.setTimeout(function() {
                container.style.display = 'none';
            }, 1000);
            //container.innerHTML = '';
        };

        // Opens the mmodal to the specified indes or to the first item
        this.open = function( index ) {
            pageIndex = index;
            self.render();
            container.style.display = 'block';
            window.setTimeout(function() {
                container.style.opacity = '1';
            }, 100);
            
        };

        // Cycles to the next item
        this.next = function() {
            var nextPage = pageIndex + 1;
            if ( nextPage >= imageIds.length ) {
                nextPage = 0;
            }
            self.open( nextPage );
        };

        // Cycles to the previous item
        this.prev = function() {
            var nextPage = pageIndex - 1;
            if ( nextPage < 0 ) {
                nextPage = imageIds.length - 1;
            }
            self.open( nextPage );
        };

    }

    function GalleryPreview( gallery, container, imageIds ) {
        var self = this;
        var pageSize = 8;
        
        this.gallery = gallery;
        this.elem;
        this.pagination;
        this.currentThumbsContainer;
        this.prevThumbsContainer;
        this.nextThumbsContainer;
        this.thumbsWrapper;
        this.numPages;
        this.currentPage;
        this.thumbs = [];

        // set thumbs
        for ( var i = 0; i < imageIds.length; i++ ) {
            this.thumbs.push( new GalleryThumb( gallery, imageIds[i], i ) );
        }

        // set the DOM element associated with this object
        var temp = document.createElement('div');
        temp.innerHTML = galleryPreviewTemplate.render();
        this.elem = temp.children[0];

        // Set references to pagination elements
        this.pagination = this.elem.getElementsByClassName('pagination')[0];
        this.prevBtn = this.pagination.getElementsByClassName('prev')[0];
        this.nextBtn = this.pagination.getElementsByClassName('next')[0];
        this.pageNum = this.pagination.getElementsByClassName('pageNum')[0];
        this.totalPages = this.pagination.getElementsByClassName('total')[0];

        // Set references to thumbs elements
        this.thumbsWrapper = this.elem.getElementsByClassName('thumbs-wrapper')[0];
        this.thumbsSlider = this.thumbsWrapper.getElementsByClassName('thumbs-slider')[0];
        this.currentThumbsContainer = this.thumbsWrapper.getElementsByClassName('current')[0];
        this.prevThumbsContainer = this.thumbsWrapper.getElementsByClassName('prev')[0];
        this.nextThumbsContainer = this.thumbsWrapper.getElementsByClassName('next')[0];
        this.numPages = Math.ceil(this.thumbs.length / pageSize);

        // store container width for shortened lines
        this.containerWidth;

        this.render = function() {
            container.appendChild(this.elem);
            this.registerEventListeners();
        };

        this.registerEventListeners = function() {
            this.prevBtn.addEventListener('click', this.prev, false);
            this.nextBtn.addEventListener('click', this.next, false);
        };

        this.open = function() {
            if (currentlyOpenPreview) {
                currentlyOpenPreview.gallery.openOrClosePreview();
            }
            currentlyOpenPreview = this;
            this.render();
            this.setPage(0);
            this.totalPages.innerHTML = this.numPages;
            // set the height to the height of two rows of thumbs
            this.elem.style.height = this.pagination.scrollHeight + this.currentThumbsContainer.scrollHeight + 'px';
        };

        this.close = function() {
            this.elem.style.height = '0px';
            currentlyOpenPreview = null;
        };

        // Cycles to the next page
        this.next = function() {
            var nextPage = self.currentPage + 1;
            if ( nextPage >= self.numPages ) {
                nextPage = 0;
            }
            self.setPage( nextPage, 'next' );
        };

        // Cycles to the previous page
        this.prev = function() {
            var nextPage = self.currentPage - 1;
            if ( nextPage < 0 ) {
                nextPage = self.numPages - 1;
            }
            self.setPage( nextPage, 'prev' );
        };

        this.setPage = function( pageIndex, anim ) {
            this.containerWidth = this.currentThumbsContainer.scrollWidth;
            if ( !anim ) {
                // this should only run when the preview is first opened to initialize it
                // make sure animations dont run when this is called
                this.thumbsSlider.style.webkitTransition = 'none';
                this.thumbsSlider.style.left = '0px';
                this.prevThumbsContainer.style.left = '-' + this.containerWidth + 'px';
                this.renderThumbs( pageIndex - 1, this.prevThumbsContainer );
                this.currentThumbsContainer.style.left = '0px';
                this.renderThumbs( pageIndex, this.currentThumbsContainer );
                this.nextThumbsContainer.style.left = this.containerWidth + 'px';
                this.renderThumbs( pageIndex + 1, this.nextThumbsContainer );
            } else {
                // perform the animation for next/prev page selection using css3
                // make sure animations run
                this.thumbsSlider.style.webkitTransition = 'left 0.3s';
                
                if ( anim == 'prev' ) {
                    this.slideRight();
                    this.renderThumbs( pageIndex - 1, this.prevThumbsContainer );
                } else if ( anim == 'next') {
                    this.slideLeft();
                    this.renderThumbs( pageIndex + 1, this.nextThumbsContainer );
                }
            }
            this.pageNum.innerHTML = pageIndex + 1;
            this.currentPage = pageIndex;
        };
        
        // utility functions for slide animations
        this.slideLeft = function() {
            var tempContainer = this.prevThumbsContainer;
            this.prevThumbsContainer = this.currentThumbsContainer;
            this.currentThumbsContainer = this.nextThumbsContainer;
            this.nextThumbsContainer = tempContainer;
            this.nextThumbsContainer.style.left = pixelsToInt(
                    this.currentThumbsContainer.style.left
                ) + this.containerWidth + 'px';
            this.thumbsSlider.style.left = pixelsToInt(
                    this.thumbsSlider.style.left
                ) - this.containerWidth + 'px';
        };
        this.slideRight = function() {
            var tempContainer = this.nextThumbsContainer;
            this.nextThumbsContainer = this.currentThumbsContainer;
            this.currentThumbsContainer = this.prevThumbsContainer;
            this.prevThumbsContainer = tempContainer;
            this.prevThumbsContainer.style.left = pixelsToInt(
                    this.currentThumbsContainer.style.left
                ) - this.containerWidth + 'px';
            this.thumbsSlider.style.left = pixelsToInt(
                    this.thumbsSlider.style.left
                ) + this.containerWidth + 'px';
        };

        // utility function for changing pixel style string to an integer
        function pixelsToInt( pixelString ) {
            return parseInt( pixelString.replace('px', '') );
        }

        // returns the html for the thumbs on this page
        this.renderThumbs = function( pageIndex, container ) {
            // clear the html inside the container
            container.innerHTML = '';
            var page = pageIndex;

            // if the page is out of normal bounds, wrap the index
            if ( page < 0 ) {
                page = this.numPages - 1;
            } else if ( page >= this.numPages ) {
                page = 0;
            }
            var startIndex = page * pageSize;
            var endIndex = startIndex + pageSize;
            
            // cutoff index if it is greater than the actual number of thumbs
            if ( endIndex >= this.thumbs.length ) {
                endIndex = this.thumbs.length;
            }

            for ( var i = startIndex; i < endIndex; i++ ) {
                this.thumbs[i].render( container );
            }
        };
            
    }
    

    function GalleryThumb( gallery, imageId, index ) {
        //var template = galleryThumbTemplate;
        var self = this;
        var params = {
            source: smallImageUrl( imageId )
        };

        // set the DOM element associated with this thumb object
        var temp = document.createElement('div');
        temp.innerHTML = galleryThumbItemTemplate.render( params );
        this.elem = temp.children[0];

        this.render = function( container, replace ) {
            if (replace == true) {
                container.innerHTML = "";
            }
            container.appendChild( this.elem );
            this.registerEventListeners();
        };

        this.height = function() {
            return this.elem.scrollHeight;
        };

        this.registerEventListeners = function() {
            var imgTag = this.elem.getElementsByTagName('img')[0];
            imgTag.addEventListener('click', this.openModal, false);
        };

        this.openModal = function() {
            gallery.modal.open(index);
        };
    }

})();
