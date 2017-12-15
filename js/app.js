let map;
let carDealerListItem = document.querySelector('.car-dealer-li-item');
let largeInfowindow;
let clickedPinImage;

let BaseUrl = "https://api.foursquare.com/v2/venues/",
fsClient_id = "client_id=Y1XQVJCMO2RXBUVFM2UDYMVD4WVU4ORDQ3ONBONR1URPE1FX",
fsClient_secret = "&client_secret=JFPUPZAFVKRID3ZERKP0BGWRC4ONQNP4V1IGJPCKVJSZRPHE",
fsVersion = "&v=20161016";

let initialDealerships = [
    { 
        name: "Premium Cars",
        brand: "Volvo",
        marker: null,
        location: {
            lat: 46.750256,
            lng: 23.519132
        },
        fs_id: "4d514b103626a0936dd222bd"
    },
    { 
        name: "Volvo Trucks",
        brand: "Volvo",
        marker: null,
        location: {
            lat: 46.751745,
            lng: 23.414045
        },
        fs_id: "500ed4c7e4b0302f936f1ecc"
    },
    { 
        name: "Autotransilvania",
        brand: "BMW",
        marker: null,
        location: {
            lat: 46.749598,
            lng: 23.518178
        },
        fs_id: "4efd785a7716488c5d970b07"
    },
    { 
        name: "Autoworld - Audi",
        marker: null,
        brand: 'Audi',
        location: {
            lat: 46.743107,
            lng: 23.592566
        },
        fs_id: "4f6d917ee4b09e7354b3eb74"
    },
    { 
        name: "DACIA Service",
        marker: null,
        brand: 'DACIA',
        location: {
            lat: 46.740938,
            lng: 23.592174
        },
        fs_id: "4c5bb25dfff99c74be962cd3"
    },
    { 
        name: "Autosincron",
        brand: 'Ford',
        marker: null,
        location: {
            lat: 46.752954,
            lng: 23.595245
        },
        fs_id: "4f7c3cd6e4b0dc29a65d59a5"
    },
    { 
        name: "Compexit Trading",
        brand: 'Ford',
        marker: null,
        location: {
            lat: 46.746713,
            lng: 23.593262
        },
        fs_id: "4d995735e07ea35d06300703"
    },
    { 
        name: "RMB Inter Auto",
        brand: 'Mercedes-Benz',
        marker: null,
        location: {
            lat: 46.743611,
            lng: 23.591782
        },
        fs_id: "4d3a9b6acc48224b6deb3e4f"
    }
];

let dealershipsViewModel;

function DealershipsViewModel(dealerships) {
    const self = this;
    this.dealerships = ko.observableArray(dealerships);
    this.brands = ['Volvo', 'BMW', 'Audi', 'DACIA', 'Ford', 'Mercedes-Benz'];
    this.selectedDealership = ko.observable();
    this.selectedMarker = ko.observable();
    this.selectedDealership.subscribe(function() {
        resetMarkers();
        filterMarkers();  
    })

    this.filteredDealers = ko.computed(function() {
        let self = this;
        if(this.selectedDealership() === undefined) {
            return this.dealerships();
        }
        return ko.utils.arrayFilter(this.dealerships(), function(item) {
            return item.brand === self.selectedDealership(); 
        });
    }, this);

    this.resetDealership = function() { this.selectedDealership(null) };
    this.toggleBounce = function() {
        let marker = this.selectedMarker();
        if (marker.getAnimation() !== null) {
          marker.setAnimation(null);
        } else {
          marker.setAnimation(google.maps.Animation.BOUNCE);
        }
    }
    this.highlightMarker = function(dealerListItem) {
        if (self.selectedMarker() !== undefined && self.selectedMarker().getAnimation() !== null) {
            self.selectedMarker().setAnimation(null);
        }
        self.selectedMarker(dealerListItem.marker);
        self.toggleBounce(dealerListItem.marker);
        populateInfoWindow(dealerListItem.marker, largeInfowindow);
        resetMarkerColor();
        dealerListItem.marker.setIcon(clickedPinImage);
    };

    this.getFoursquareData = ko.computed(function(){
        initialDealerships.forEach(function(space) {  
          // Set initail variables to build the correct URL for each space
          var  venueId = space.fs_id + "/?";
          var foursquareUrl = BaseUrl + venueId + fsClient_id + fsClient_secret + fsVersion;
  
            // AJAX call to Foursquare
            $.ajax({
                type: "GET",
                url: foursquareUrl,
                dataType: "json",
                cache: false,
                success: function(data) {
                    var response = data.response ? data.response : "";
                    var venue = response.venue ? data.venue : "";
                    space.name = response.venue.name;
                    space.shortUrl = response.venue.shortUrl;
                    space.photoUrl = response.venue.bestPhoto["prefix"] + "height150" +
                    response.venue.bestPhoto["suffix"];
                    space.fsContent = true;
                },
                error: function() {
                    space.fsContent = false;
                }
            });
        });
    });
}

dealershipsViewModel = new DealershipsViewModel(initialDealerships);

ko.applyBindings(dealershipsViewModel);

// Get content infowindows

function setForsquareContent(space) {
    var contentString = "<div id='forsquare-data'><h3>" + space.name +
        "</h3><br><div style='width:200px;min-height:120px'><img src=" + '"' +
        space.photoUrl + '"></div><div><a href="' + space.shortUrl +
        '" target="_blank">More info in Foursquare</a><img id="fs-logo" src="img/fs-logo.png"></div>';
    var errorString = "Oops, Foursquare content not available."
    if (space.name.length > 0 && space.fsContent) {
        return contentString;
        } else {
        return errorString;
        }
}

function populateInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
      // Clear the infowindow content to give the streetview time to load.
      infowindow.setContent('');
      infowindow.marker = marker;
      // Make sure the marker property is cleared if the infowindow is closed.
      infowindow.addListener('closeclick', function() {
        infowindow.marker = null;
      });
      var streetViewService = new google.maps.StreetViewService();
      var radius = 500;

      // In case the status is OK, which means the pano was found, compute the
      // position of the streetview image, then calculate the heading, then get a
      // panorama from that and set the options
      function getStreetView(data, status) {
        if (status == google.maps.StreetViewStatus.OK) {
          var nearStreetViewLocation = data.location.latLng;
          var heading = google.maps.geometry.spherical.computeHeading(
            nearStreetViewLocation, marker.position);
            infowindow.setContent('<div class="info-window"><div id="street-view">' + marker.title + '</div><div id="pano"></div>' + setForsquareContent(initialDealerships[marker.index]) + '</div>');
            var panoramaOptions = {
              position: nearStreetViewLocation,
              pov: {
                heading: heading,
                pitch: 30
              }
            };
          var panorama = new google.maps.StreetViewPanorama(
            document.getElementById('pano'), panoramaOptions);
        } else {
          infowindow.setContent('<div>' + marker.title + '</div>' +
            '<div>No Street View Found</div>');
        }
      }
      // Use streetview service to get the closest streetview image within
      // 50 meters of the markers position
      streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
      // Open the infowindow on the correct marker.
      infowindow.open(map, marker);
    }
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 46.77121, lng: 23.623635},
        zoom: 13
    });

    var pinColor = ['1C69D4', 'FE7569'];
    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor[0],
    new google.maps.Size(21, 34),
    new google.maps.Point(0,0),
    new google.maps.Point(10, 34));

    clickedPinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + 'FE7569',
    new google.maps.Size(21, 34),
    new google.maps.Point(0,0),
    new google.maps.Point(10, 34));

    let myHome = {lat: 46.737583, lng: 23.587853};
    let marker = new google.maps.Marker({
        position: myHome,
        map: map,
        title: 'My Home'
    });

    largeInfowindow = new google.maps.InfoWindow();

    let bounds = new google.maps.LatLngBounds();
    let i = 0;
    initialDealerships.forEach(function (dealership) {
        let title = dealership.name;
        let position = dealership.location;
        dealership.marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            icon: pinImage,
            index: i++
        });

        bounds.extend(dealership.marker.position);
        map.fitBounds(bounds);

        dealership.marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
            resetMarkerColor();
            this.setIcon(clickedPinImage);
            removeBounce();
          });
    
    });   
}

function filterMarkers() {
    initialDealerships.forEach(function(dealership) {
        if(dealership.brand !== dealershipsViewModel.selectedDealership() && dealershipsViewModel.selectedDealership() !== undefined) {
            dealership.marker.setMap(null);
            console.log("dealership.brand: " + dealership.brand);
            console.log("dealershipsViewModel.selectedDealership(): " + dealershipsViewModel.selectedDealership());
        };
    });
};

function resetMarkers() {
    initialDealerships.forEach(function(dealership) {
        dealership.marker.setMap(map);
    });
};

function removeBounce() {
    initialDealerships.forEach(function(dealership) {
        dealership.marker.setAnimation(null);
    });
};

function resetMarkerColor() {

    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + '1C69D4',
    new google.maps.Size(21, 34),
    new google.maps.Point(0,0),
    new google.maps.Point(10, 34));

    initialDealerships.forEach(function(dealership) {
        dealership.marker.setIcon(pinImage);   
    });
}

// Map loading error handling function
mapError = () => {
    document.getElementById('map').innerHTML = '<span><h1>Map loading error</h1></span>';
  };

  initialDealerships.forEach(function(dealership) {
    dealership.forsquareContent = setForsquareContent(dealership);
});
