import React from 'react';
import {Text, View, Dimensions, StyleSheet, StatusBar, PermissionsAndroid, Platform} from 'react-native';
// import MapView, {Marker, Polyline} from 'react-native-maps';
import {Appbar} from "react-native-paper";
import {Styles} from "../common";
import Utils from "../common/Utils";
import Config from "../common/Config";
import Services from "../common/Services";
import OfflineNotice from './../common/OfflineNotice';
import HomeScreen from "../HomeScreen";
import {PERMISSIONS, request} from "react-native-permissions";



const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE =  37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;


class UsersMapView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            region: {
                latitude: LATITUDE,
                longitude: LONGITUDE
            }
        }
    }

    getUserLocations(){
        const self =this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_SITE_USER_LOCATIONS;
        const body = '';
        Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
            const usersLocationsData = response.data;
            // console.log('AnimatedRegion', usersLocationsData)
            if (usersLocationsData) {
                const coordinates = [];
                if (usersLocationsData.length > 0) {
                    for (let i = 0; i < usersLocationsData.length; i++) {
                        var data = {};
                        data.LatLng = {};
                        let latitude = usersLocationsData[i].latLong.latitude;
                        let longitude = usersLocationsData[i].latLong.longitude;
                        data.LatLng.latitude = latitude;
                        data.LatLng.longitude = longitude;
                        data.id = i;
                        data.title = usersLocationsData[i].fullName;
                        coordinates.push(data);
                    }
                    // console.log('coordinates', coordinates);

                    self.setState({
                        showMaps: true,
                        coordinates: coordinates,
                        spinnerBool: false,
                        lat: coordinates[0].LatLng.latitude,
                        long: coordinates[0].LatLng.longitude,
                        LAST_INDEX: usersLocationsData.length - 1
                    })
                } else {
                    Utils.dialogBox('No Locations Found', '');
                    self.setState({
                        showMaps: false,
                        coordinates: coordinates,
                        spinnerBool: false
                    })
                }
            } else {
                Utils.dialogBox('No Location data Found', '')
            }
            self.setState({usersLocationsData: usersLocationsData});
        }, function (error) {
            // console.log("error", error);
        })
    }

    async requestLocationPermission() {
        try {
            const granted = request(Platform.OS === 'ios' ?
                PERMISSIONS.IOS.LOCATION_ALWAYS || PERMISSIONS.IOS.LOCATION_WHEN_IN_USE :
                PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION).then(async (result) => {
                if ('granted' === result) {
                    console.log('You can use the Location');
                } else {
                    console.log('Location permission denied');
                }
            });
        }catch (err) {
            console.warn(err);
        }
    }

    componentDidMount() {
        this.requestLocationPermission();
        this.getUserLocations();
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }


    render() {
        return (
            <View style={[Styles.flex1]}>
                <OfflineNotice/>
                <Appbar.Header style={[Styles.bgWhite]}>
                    <Appbar.BackAction onPress={() => {
                        this.props.navigation.goBack()
                    }}/>
                    <Appbar.Content title="Users Latest Location" subtitle=""/>
                </Appbar.Header>
            </View>
        );
    }
}


const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        alignItems: 'center',
        top: 40
    },

    bubble: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        marginVertical: 20,
        backgroundColor: 'transparent',
    },
});

export default UsersMapView;
