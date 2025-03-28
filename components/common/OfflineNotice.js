import React, {PureComponent} from 'react';
import {
    View,
    Dimensions,
    StyleSheet,
    NativeModules,
    Image,
    PermissionsAndroid,
    Linking, Alert
} from 'react-native';
// import NetInfo from "@react-native-community/netinfo";
import {Styles} from "./Styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Utils from "./Utils";
import FastImage from "react-native-fast-image";
import Geolocation from '@react-native-community/geolocation';
import Services from "./Services";
 import HomeScreen from "../HomeScreen";
import DeviceInfo from "react-native-device-info";
import MockLocationCheck from "./MockLocationCheck";
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';


var LocationService = NativeModules.LocationService; //LOCATIONS SERIVCES CALL
const {width} = Dimensions.get('window');
var Internet_connection = require("../../assets/images/Internet_connection.png");

function MiniOfflineSign() {
    return (
        <View style={styles.offlineContainer}>
            <View style={[Styles.flex1, {justifyContent: 'center', alignSelf: 'center'}]}>
                {/*<MaterialIcons*/}
                {/*    style={[Styles.aslCenter, Styles.m10]}*/}
                {/*    name="signal-cellular-connected-no-internet-4-bar" size={150} color="#000"/>*/}
                {/*<Image style={[Styles.bgAsh,{ width: 200, height: 200,}]} source={require("../../assets/images/Internet_connection.png")} />*/}
                <FastImage source={Internet_connection}
                           style={[Styles.aslCenter, {
                               height: Dimensions.get("window").height / 1.8,
                               width: Dimensions.get("window").width - 80,
                               resize: 'cover'
                           }]}/>
                {/*<Text style={[Styles.ffMbold,Styles.f18,Styles.cBlk,Styles.padH10,Styles.aslCenter]}>No*/}
                {/*    Internet Connection</Text>*/}
            </View>
        </View>
    );
}

class OfflineNotice extends PureComponent {
    constructor(props) {
        super(props);
        // this.requestLocationPermission();
        // this.checkDeviceInfo();
        // this.notificationListener();
        // this.requestCurrentLocation()
        this.state = {
            isConnected: true,
        };
    }

    checkDeviceInfo() {
        DeviceInfo.getApiLevel().then((apiLevel) => {
            // console.log('offline apiLevel', apiLevel)
            if (apiLevel >= 29) {
                this.requestBackgroundPermission()
            } else {
                this.requestLocationPermission()
            }
        });
    }

    notificationListener() {
        // console.warn('notificationListener fun enter');
    }

    DeepLinkFunction() {
        if (Platform.OS === 'android') {
            Linking.getInitialURL().then(url => {
                // console.log('deep function url=====@==', url);
                this.navigate(url);
            });
        } else {
            Linking.addEventListener('url', this.handleOpenURL);
        }
    }

    componentDidMount() {
        // NetInfo.isConnected.fetch().then(isConnected => {
        //     // console.log('First, is ' + (isConnected ? 'online' : 'offline'));
        // });
        // NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
    }

    componentWillUnmount() { // C
        // NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
    }

    onReceived(notification) {
        // console.log("offline Notification received: ", notification);
    }

    onOpened(openResult) {
        // const {navigate} = this.props.navigation;
        // const {navigator}=this.props.navigation
        // console.log("Opened Notification offline");
        // console.log('Message: ', openResult.notification.payload.body);
        // console.log('Data: ', openResult.notification.payload.additionalData);
        // console.log('isActive: ', openResult.notification.isAppInFocus);
        // navigator('Notifications')
        // this.props.navigation.navigate('Notifications')
        // this.navigate(openResult.notification.payload.launchURL)
        // this.props.navigation.goBack();
        // HomeScreen.prototype.NotificationNavigator(openResult)
    }

    handleOpenURL = (event) => { // D
        console.log('deep handleOpenURL event ', event);
        this.navigate(event.url);
    }


    navigate = (url) => { // E
        console.log('deep URL==', url);
        const {navigate} = this.props.navigation;
        const route = url.replace(/.*?:\/\//g, '');
        console.log('deep route', route);

        if (route === 'article') {
            console.log('route inside navigation', route);
            navigate('Notifications')
            // navigate('SiteListingScreen')
        }
    }


    async requestCurrentLocation() {
        Geolocation.getCurrentPosition(
            (position) => {
                const currentLocation = position.coords;
                // console.log('OFFLINE locaitons',currentLocation);
            },
            (error) => {
console.log('OFFLIEN lopcation error')
            }
        );
    }

    async requestBackgroundPermission() {
        try {
            // const grantedBackground = await PermissionsAndroid.request(
            //     PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
            // );
            const grantedBackground = await request(
                Platform.select({
                    android: PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
                    ios: PERMISSIONS.IOS.LOCATION_ALWAYS || PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
                }),
            );


            if (grantedBackground === RESULTS.GRANTED) {
                await this.requestCurrentLocation()
            } else {
                Alert.alert('App needs Background Location Permissions', 'Select Allow all the time in App Permissions',
                    [
                        {
                            text: 'Ask Again', onPress: () => {
                                this.requestBackgroundPermission()
                            }
                        },
                        {
                            text: 'Open Settings', onPress: () => {
                                Linking.openSettings()
                            }
                        }
                    ]
                )
            }
        } catch (err) {
            console.warn(err);
            Utils.dialogBox(err, '')
        }
    }


    async requestLocationPermission() {
        try {
            // const granted = await PermissionsAndroid.request(
            //     PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            // );
            // const granted = await request(
            //     Platform.select({
            //       android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
            //       ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
            //     }),
            // );

            const granted = request(Platform.OS === 'ios' ?
                PERMISSIONS.IOS.LOCATION_ALWAYS || PERMISSIONS.IOS.LOCATION_WHEN_IN_USE :
                PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION).then((result) => {
                // setPermissionResult(result)
                if ('granted' === result || granted === result) {
                    this.requestCurrentLocation();
                } else {
                    Utils.dialogBox('Location permission denied', '');
                    Services.deniedLocationAlert()
                }
            });
        } catch (err) {
            console.log('permss error',err);
            Utils.dialogBox('OFFLINE Location Error','');
        }
    }

    checkGPSpermission() {

    }

    //Check current shift status and Start or Stop Location
    async checkLocationStatus() {
        // console.log('Check location status at offline ')
        if (this.state.isConnected) {
            AsyncStorage.getItem('Whizzard:currentShiftStatus').then((currentShift) => {
                let currentShiftStatus = JSON.parse(currentShift)
                // console.log('offline currentshiftstatsu',currentShiftStatus)
                if (currentShiftStatus) {
                    if (currentShiftStatus === 'SHIFT_IN_PROGRESS') {
                        this.checkDeviceInfo()
                        this.checkLocationisRunning();
                    } else if (currentShiftStatus === 'INIT' || currentShiftStatus === 'MARKED_ATTENDANCE') {
                        this.checkDeviceInfo()
                    } else {

                    }
                } else {
                    this.requestLocationPermission()
                }
            });
        } else {
        }
    }

    //check location running status
    async checkLocationisRunning() {
        await LocationService.isLocationRunning((err) => {
            // console.log('isLocationRunning error', err)
        }, (msg) => {
            // console.log('checkLocationisRunning message in offlien',msg);
        });
    }

    handleConnectivityChange = isConnected => {
        // console.log('handleConnectivityChange fun eneter')
        this.setState({isConnected});
    };

    render() {
        if (!this.state.isConnected) {
            return <MiniOfflineSign/>;
        }
        return null;
    }
}

const styles = StyleSheet.create({
    offlineContainer: {
        // backgroundColor: '#b52424',
        backgroundColor: '#fff',
        height: Dimensions.get("window").height,
        width: Dimensions.get("window").width,
        // justifyContent: 'center',
        // alignItems: 'center',
        // flexDirection: 'row',
        // position: 'absolute',
    },
    offlineText: {color: '#fff'}
});
export default OfflineNotice;
