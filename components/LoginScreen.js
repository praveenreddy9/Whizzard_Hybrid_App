import React, {Component} from 'react';
import {
    StyleSheet,
    Text,
    View,
    KeyboardAvoidingView,
    ScrollView,
    TouchableOpacity,
    Keyboard,
    NativeModules,
    PermissionsAndroid,
    Alert, Linking, Settings, Platform
} from 'react-native';
import Utils from './common/Utils';
import Config from './common/Config';
import {CheckBox} from 'react-native-elements';
import {Styles, CSpinner, LoadSVG} from './common';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Services from './common/Services';
import {TextInput, DefaultTheme} from 'react-native-paper';
import Geolocation from 'react-native-geolocation-service';
import DeviceInfo from 'react-native-device-info';
import * as permissions from 'react-native-permissions';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {Appbar, Button, Card, Chip} from 'react-native-paper';


let LocationService = NativeModules.LocationService; //LOCATIONS SERIVCES CALL

const theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        text: '#233167',
        primary: '#233167',
        underlineColor: 'transparent',
    },
};

export default class LoginScreen extends Component {
    constructor() {
        super();
        this.showAlertofLocation();
        this.handleLocalStorage();
        // this.requestLocationPermission();
        this.notificationListener();
        this.keyboardWillShow = this.keyboardWillShow.bind(this);
        this.keyboardWillHide = this.keyboardWillHide.bind(this);
        this.state = {
            phoneNumber: '',
            password: '',
            rememberMe: true,
            token: '',
            spinnerBool: false,
            KeyboardVisible: true,
            ErrorMessage: '',
            isValidMobileNumber: null,
            isValidPassword: null,
            errorPassMessage: null,
            errorMobileMessage: null,
            showLogin: false,
            showPassword: false,
        };
    }

    notificationListener() {
    }

    renderSpinner() {
        if (this.state.spinnerBool) {
            return <CSpinner/>;
        }
        return false;
    }

    async componentDidMount() {
        this.getCache();
        this.keyboardWillShowSub = Keyboard.addListener(
            'keyboardDidShow',
            this.keyboardWillShow,
        );
        this.keyboardWillHideSub = Keyboard.addListener(
            'keyboardDidHide',
            this.keyboardWillHide,
        );
    }

    componentWillUnmount() {
        this.keyboardWillShowSub.remove();
        this.keyboardWillHideSub.remove();
    }

    onOpened(openResult) {
        let url = '';
        let data = openResult.notification.payload.body;
        if (openResult.notification.payload.launchURL) {
            url = openResult.notification.payload.launchURL;
        } else {
            if (openResult.notification.payload.additionalData) {
                url = openResult.notification.payload.additionalData.url;
            } else {
                url = '';
            }
        }
        const {navigate} = this.props.navigation;
        if (url) {
            const route = url.replace(/.*?:\/\//g, '');

            if (route === 'ShiftSummary') {
                navigate('ShiftSummary', {
                    shiftId: openResult.notification.payload.additionalData.shiftId,
                });
            } else if (route === 'Notifications') {
                let notificationImage = '';
                if (openResult.notification.payload.launchURL) {
                    if (openResult.notification.payload.bigPicture) {
                        notificationImage = openResult.notification.payload.bigPicture;
                    } else {
                        notificationImage = '';
                    }
                } else if (openResult.notification.payload.bigPicture) {
                    if (openResult.notification.payload.bigPicture) {
                        notificationImage = openResult.notification.payload.bigPicture;
                    } else {
                        notificationImage = '';
                    }
                } else {
                    notificationImage = '';
                }
                navigate('Notifications', {notificationImage: notificationImage});
            }
        } else {
            navigate('authNavigator');
        }
    }

    onIds(device) {
        if (device.userId) {
            Utils.setToken('DEVICE_ID', device.userId, function () {
            });
        }
    }

    keyboardWillShow = event => {
        this.setState({
            KeyboardVisible: false,
        });
    };

    keyboardWillHide = event => {
        this.setState({
            KeyboardVisible: true,
        });
    };

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
                if ('granted' === result) {
                    this.requestCurrentLocation();
                } else {
                    Alert.alert(Services.returnLocationDeniedTextTitle(),Services.returnLocationDeniedTextMessage(),[
                        {
                            text: 'Not Now'
                        },
                        {
                            text: 'Settings',
                            onPress: () => {
                                Linking.openSettings()
                            },
                        },
                    ],)
                }
            });
        } catch (err) {
            Utils.dialogBox('Login Location Error', '');
        }
    }

    async requestCurrentLocation() {
        Geolocation.getCurrentPosition(
            position => {
                const currentLocation = position.coords;
                this.setState({
                    currentLocation: currentLocation,
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                });
            },
            error => {
                Utils.dialogBox(error.message, '');
            },
            // {enableHighAccuracy: false, timeout: 10000, maximumAge: 100000}
            // {enableHighAccuracy: true, timeout: 25000, maximumAge: 3600000}
            {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000},
        );
    }

    async showAlertofLocation() {
        Alert.alert(
            Services.returnLocationTitle(),
            Services.returnLocationMessage(),
            [
                {
                    text: 'Continue',
                    onPress: () => {
                        this.requestLocationPermission();
                    },
                },
            ],
        );
    }

    async handleLocalStorage() {
        try {
            await AsyncStorage.removeItem('Whizzard:token');
            await AsyncStorage.removeItem('Whizzard:userId');
            await AsyncStorage.removeItem('Whizzard:shiftId');
            await AsyncStorage.removeItem('Whizzard:currentShiftStatus');
            await AsyncStorage.removeItem('Whizzard:locationStatus');
            await AsyncStorage.removeItem('Whizzard:userRole');
            await AsyncStorage.removeItem('Whizzard:userStatus'); //===>for canEditTextput check in profile
            await AsyncStorage.removeItem('Whizzard:selectedUserSiteDetails'); //===>TeamListing
            await AsyncStorage.removeItem('Whizzard:selectedSiteDetails'); //===>sitelisting
            await AsyncStorage.removeItem('Whizzard:profilePicUrl'); //===>profilePicUrl Authnav
            // this.props.navigation.navigate('authNavigator');
            // this.props.navigation.navigate('Login')
            return true;
        } catch (exception) {
            return false;
        }
    }

    onChangeCheck() {
        const self = this;
        if (self.state.rememberMe === true) {
            let userDetails = {
                rememberphoneNumber: self.state.phoneNumber,
                rememberPassword: self.state.password,
            };
            Utils.setToken(
                'loginDetails',
                JSON.stringify(userDetails),
                function (data) {
                },
            );
        } else {
            AsyncStorage.removeItem('Whizzard:loginDetails');
        }
    }

    async getCache() {
        try {
            let value = await AsyncStorage.getItem('Whizzard:loginDetails');
            let parsed = JSON.parse(value);
            this.setState({
                phoneNumber: parsed.rememberphoneNumber,
                password: parsed.rememberPassword,
            });
            if (this.state.phoneNumber || this.state.password) {
                this.onLogin();
            }
        } catch (e) {
            console.log('caught error', e);
            // Handle exceptions
        }
    }

    httpLoginRequest = () => {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.POST_LOGIN;
        const body = JSON.stringify({
            phoneNumber: self.state.phoneNumber,
            password: self.state.password,
            longitude: this.state.longitude,
            latitude: this.state.latitude,
            brand: DeviceInfo.getBrand(),
            modal: DeviceInfo.getModel(),
            type: DeviceInfo.getSystemName(),
            AndroidId: Platform.OS === 'ios' ? null : DeviceInfo.getDeviceId(),
            IOSId:Platform.OS === 'ios' ? DeviceInfo.getDeviceId() : null,
            systemVersion: DeviceInfo.getSystemVersion(),
        });
        this.setState({spinnerBool: true}, response => {
            Services.NoAuthHTTPRequestinData(
                apiUrl,
                'POST',
                body,
                function (response) {
                    if (response) {
                        let result = response.data;
                        Utils.setToken('requireSocketAction', JSON.stringify(result.requireSocketAction), function () {
                        });
                        Utils.setToken('phoneNumber', JSON.stringify(self.state.phoneNumber), function () {
                        });
                        let token = result.accessToken;
                        let tokenType = result.tokenType;
                        let accessToken = tokenType + ' ' + token;
                        if (!self.state.rememberMe) {
                            self.setState({phoneNumber: '', password: ''});
                        }
                        Utils.setToken('token', accessToken, function () {
                        });
                        Utils.setToken('userStatus', result.status, function () {
                        });
                        Utils.setToken(
                            'userRole',
                            JSON.stringify(result.role),
                            function () {
                            },
                        );
                        Utils.setToken(
                            'profilePicUrl',
                            result.profilePicUrl,
                            function () {
                            },
                        );
                        Utils.setToken('userId', result.id, function () {
                        });

                        if (result.role <= 15 && result.status === 'ACTIVATED') {
                            if (result.lastLogIn === null) {
                                self.setState({spinnerBool: false}, () => {
                                    Utils.dialogBox('Reset your Password', '');
                                    self.props.navigation.navigate('ResetPassword', {
                                        phoneNumber: result.id,
                                        code: 'FirstLogin',
                                    });
                                });
                            } else {
                                self.setState({spinnerBool: false}, () => {
                                    Utils.dialogBox('Successfully LoggedIn', '');
                                    self.props.navigation.navigate('authNavigator');
                                });
                            }
                        } else {
                            self.setState({spinnerBool: false}, () => {
                                Utils.dialogBox('Successfully LoggedIn', '');
                                self.props.navigation.navigate('authNavigator');
                            });
                        }
                    }
                },
                function (error) {
                    if (error.response) {
                        if (error.response.status === 403) {
                            self.setState({spinnerBool: false});
                            Utils.dialogBox('Token Expired,Please Login Again', '');
                            self.props.navigation.navigate('Login');
                        } else if (error.response.status === 500) {
                            self.setState({spinnerBool: false});
                            if (error.response.data.message) {
                                Utils.dialogBox(error.response.data.message, '');
                            } else if (error.response.data.code) {
                                Utils.dialogBox(error.response.data.code, '');
                            } else {
                                Utils.dialogBox('Bad Credentials', '');
                            }
                        } else if (error.response.status === 400) {
                            self.setState({spinnerBool: false});
                            if (error.response.data.message) {
                                Utils.dialogBox(error.response.data.message, '');
                            } else {
                                Utils.dialogBox(error.response.data.code, '');
                            }
                        } else {
                            self.setState({spinnerBool: false});
                            Utils.dialogBox(
                                'Error loading Shift Data, Please contact Administrator ',
                                '',
                            );
                        }
                    } else {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox(error.message, '');
                    }
                },
            );
        });
    };

    onLogin = () => {
        this.onChangeCheck();
        let resp = {};
        let result = {};
        resp = Utils.isValidMobileNumber(this.state.phoneNumber);
        if (resp.status === true) {
            result.phoneNumber = resp.message;
            this.setState({isValidMobileNumber: true, errorMobileMessage: ''});
            resp = Utils.isValidPassword(this.state.password);
            if (resp.status === true) {
                result.password = resp.message;
                this.setState({
                    isValidPassword: true,
                    errorPassMessage: '',
                    showLogin: true,
                });
            } else {
                this.password.focus();
                this.setState({
                    isValidPassword: false,
                    errorPassMessage: resp.message,
                    showLogin: false,
                });
            }
        } else {
            this.phoneNumber.focus();
            this.setState({
                isValidMobileNumber: false,
                errorMobileMessage: resp.message,
                showLogin: false,
            });
        }
    };

    render() {
        return (
            <View style={styles.container}>
                {/*<OfflineNotice/>*/}
                {/*<MockLocationCheck/>*/}
                {this.renderSpinner()}
                <ScrollView
                    // persistentScrollbar={true}
                    style={{marginHorizontal: 20,marginTop:15}}>
                    <View style={{marginTop: 20, marginBottom: 30}}>
                        {LoadSVG.whizzard_logo}

                        <Text style={[Styles.colorBlue, Styles.f28, Styles.ffMbold]}>
                            Welcome,
                        </Text>
                        <Text style={[Styles.colorBlue, Styles.f25, Styles.ffMregular]}>
                            Sign in to continue
                        </Text>
                    </View>

                    <KeyboardAvoidingView behavior={'height'} style={[Styles.flex1]}>
                        <View>
                            <TextInput
                                label="Mobile Number*"
                                mode="outlined"
                                theme={theme}
                                returnKeyType="next"
                                blurOnSubmit={false}
                                placeholder="Mobile Number"
                                placeholderTextColor="red"
                                keyboardType="numeric"
                                ref={input => {
                                    this.phoneNumber = input;
                                }}
                                onSubmitEditing={() => {
                                    this.password.focus();
                                }}
                                onChangeText={phoneNumber =>
                                    this.setState({phoneNumber}, () => {
                                        this.onLogin();
                                    })
                                }
                                value={this.state.phoneNumber}
                            />
                            {this.state.errorMobileMessage ? (
                                <Text
                                    style={{
                                        color: 'red',
                                        paddingLeft: 20,
                                        marginBottom: 10,
                                    }}>
                                    {this.state.errorMobileMessage}
                                </Text>
                            ) : (
                                <Text/>
                            )}
                            {this.state.isValidMobileNumber === true
                                ? Services.successIcon()
                                : this.state.isValidMobileNumber === false
                                    ? Services.errorIcon()
                                    : null}
                        </View>

                        <View>
                            <TextInput
                                label="Password*"
                                theme={theme}
                                mode="outlined"
                                autoCompleteType="off"
                                placeholderTextColor="#233167"
                                autoCapitalize="none"
                                blurOnSubmit={false}
                                returnKeyType="done"
                                placeholder="Password"
                                secureTextEntry={this.state.showPassword === false}
                                value={this.state.password}
                                ref={input => {
                                    this.password = input;
                                }}
                                onSubmitEditing={() => {
                                    Keyboard.dismiss();
                                    this.onLogin();
                                }}
                                onChangeText={password =>
                                    this.setState({password}, () => {
                                        this.onLogin();
                                    })
                                }
                            />
                            {this.state.errorPassMessage ? (
                                <Text
                                    style={{
                                        color: 'red',
                                        paddingLeft: 20,
                                        marginBottom: 10,
                                    }}>
                                    {this.state.errorPassMessage}
                                </Text>
                            ) : (
                                <Text/>
                            )}
                            {this.state.isValidPassword === true
                                ? Services.successIcon()
                                : this.state.isValidPassword === false
                                    ? Services.errorIcon()
                                    : null}
                        </View>

                        <View style={[Styles.row, Styles.jSpaceArd]}>
                            <TouchableOpacity
                                style={[Styles.row, {right: 10}]}
                                onPress={() =>
                                    this.setState(
                                        {rememberMe: !this.state.rememberMe},
                                        function () {
                                            this.onChangeCheck();
                                        },
                                    )
                                }>
                                <CheckBox
                                    containerStyle={{
                                        backgroundColor: '#fff',
                                        borderWidth: 0,
                                    }}
                                    checkedColor="#36A84C"
                                    size={25}
                                    onPress={() =>
                                        this.setState(
                                            {rememberMe: !this.state.rememberMe},
                                            function () {
                                                this.onChangeCheck();
                                            },
                                        )
                                    }
                                    checked={this.state.rememberMe}
                                />
                                <Text
                                    style={[
                                        Styles.f16,
                                        Styles.colorBlue,
                                        Styles.ffMbold,
                                        Styles.aslCenter,
                                        {right: 16},
                                    ]}>
                                    Remember me
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[Styles.row, {left: 10}]}
                                onPress={() =>
                                    this.setState({showPassword: !this.state.showPassword})
                                }>
                                <CheckBox
                                    containerStyle={{
                                        backgroundColor: '#fff',
                                        borderWidth: 0,
                                    }}
                                    checkedColor="#36A84C"
                                    size={25}
                                    onPress={() =>
                                        this.setState({showPassword: !this.state.showPassword})
                                    }
                                    checked={this.state.showPassword}
                                />
                                <Text
                                    style={[
                                        Styles.f16,
                                        Styles.colorBlue,
                                        Styles.ffMbold,
                                        Styles.aslCenter,
                                        {right: 16},
                                    ]}>
                                    Show password
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[Styles.row, Styles.jEnd]}>
                            <TouchableOpacity
                                style={[Styles.mTop10]}
                                onPress={() =>
                                    this.props.navigation.navigate('ForgotPassword')
                                }
                            >
                                <Text style={[Styles.f16, Styles.colorBlue, Styles.ffMbold]}>
                                    {' '}
                                    Forgot password?{' '}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>

                    <TouchableOpacity
                        onPress={() => this.httpLoginRequest()}
                        disabled={!this.state.showLogin}
                        style={[
                            Styles.mTop40,
                            {
                                backgroundColor:
                                    this.state.showLogin === false ? '#cccccc' : '#C91A1F',
                            },
                            Styles.bcRed,
                            Styles.br5,
                        ]}>
                        <Text
                            style={[
                                Styles.f18,
                                Styles.ffMbold,
                                Styles.cWhite,
                                Styles.padH10,
                                Styles.padV10,
                                Styles.aslCenter,
                            ]}>
                            CONTINUE
                        </Text>
                    </TouchableOpacity>

                    <View
                        style={{
                            flexDirection: 'row',
                            marginTop: 15,
                            justifyContent: 'center',
                        }}>
                        <Text
                            style={{
                                color: '#848CAA',
                                fontSize: 16,
                            }}>
                            Don't have an account?
                        </Text>
                        <TouchableOpacity
                            onPress={() => this.props.navigation.navigate('Signup')}>
                            <Text
                                style={{
                                    color: Services.returnServerBasedColor('login'),
                                    fontSize: 16,
                                }}>
                                {' '}
                                Sign up{' '}
                            </Text>
                        </TouchableOpacity>
                        <Text
                            style={{
                                color: '#848CAA',
                                fontSize: 16,
                            }}>
                            now.
                        </Text>
                    </View>
                </ScrollView>
                {Services.returnAPKdate()}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        textAlign: 'center',
        backgroundColor: '#fff',
        color: 'red',
    },
    input: {
        height: 40,
        backgroundColor: 'rgba(225,225,225,0.2)',
        marginBottom: 20,
        padding: 10,
        color: '#fff',
    },
    submitButton: {
        backgroundColor: '#f3cc14',
        marginTop: 40,
        height: 40,
    },
    submitButtonText: {
        color: '#000',
        textAlign: 'center',
        fontSize: 20,
        lineHeight: 40,
    },
    proceedButton: {
        backgroundColor: '#f3cc14',
        marginTop: 10,
        // height: 30,
    },
    proceedButtonText: {
        color: '#000',
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 20,
    },
});
