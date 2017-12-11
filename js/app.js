let map;
let carDealerListItem = document.querySelector('.car-dealer-li-item');

let initialDealerships = [
    { 
        name: "Premium Cars",
        brand: "Volvo",
        marker: null,
        location: {
            lat: 46.750256,
            lng: 23.519132
        }
    },
    { 
        name: "Volvo Trucks",
        brand: "Volvo",
        marker: null,
        location: {
            lat: 46.751745,
            lng: 23.414045
        }
    },
    { 
        name: "BMW",
        brand: "BMW",
        marker: null,
        location: {
            lat: 46.749598,
            lng: 23.518178
        }
    },
    { 
        name: "Audi",
        marker: null,
        brand: 'Audi',
        location: {
            lat: 46.743107,
            lng: 23.592566
        }
    },
    { 
        name: "DACIA Service",
        marker: null,
        brand: 'DACIA',
        location: {
            lat: 46.740938,
            lng: 23.592174
        }
    },
    { 
        name: "Autosincron",
        brand: 'Ford',
        marker: null,
        location: {
            lat: 46.752954,
            lng: 23.595245
        }
    },
    { 
        name: "Compexit Trading",
        brand: 'Ford',
        marker: null,
        location: {
            lat: 46.746713,
            lng: 23.593262
        }
    },
    { 
        name: "Mercedes-Benz",
        brand: 'Mercedes-Benz',
        marker: null,
        location: {
            lat: 46.743611,
            lng: 23.591782
        }
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
        self.toggleBounce();
    };
}

dealershipsViewModel = new DealershipsViewModel(initialDealerships);



ko.applyBindings(dealershipsViewModel);

// var locations = [
//     {title: 'Volvo', location: {lat: 46.750256, lng: 23.519132}},
//     {title: 'BMW', location: {lat: 46.749598, lng: 23.518178}},
//     {title: 'Audi', location: {lat: 46.743107, lng: 23.592566}},
//     {title: 'DACIA', location: {lat: 46.740938, lng: 23.592174}},
//     {title: 'Ford', location: {lat: 46.752954, lng: 23.595245}},
//     {title: 'Mercedes', location: {lat: 46.743611, lng: 23.591782}}
// ];

function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 46.77121, lng: 23.623635},
        zoom: 13
    });

    var pinColor = ['9a91ea', 'FE7569'];
    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor[0],
    new google.maps.Size(21, 34),
    new google.maps.Point(0,0),
    new google.maps.Point(10, 34));

    let myHome = {lat: 46.737583, lng: 23.587853};
    let marker = new google.maps.Marker({
        position: myHome,
        map: map,
        title: 'My Home'
    });

    var largeInfowindow = new google.maps.InfoWindow();

    let bounds = new google.maps.LatLngBounds();

    initialDealerships.forEach(function (dealership) {
        let title = dealership.name;
        let position = dealership.location;
        dealership.marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            icon: pinImage
        });

        bounds.extend(dealership.marker.position);
        map.fitBounds(bounds);

        dealership.marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
          });
    
    });

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
          var radius = 50;
          // In case the status is OK, which means the pano was found, compute the
          // position of the streetview image, then calculate the heading, then get a
          // panorama from that and set the options
          function getStreetView(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
              var nearStreetViewLocation = data.location.latLng;
              var heading = google.maps.geometry.spherical.computeHeading(
                nearStreetViewLocation, marker.position);
                infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
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



