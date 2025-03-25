import React from 'react';
import {
    Text,
    View,
    Modal,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    KeyboardAvoidingView,
    Keyboard,
    TextInput as Input,
    Image,
    DatePickerAndroid,
    Vibration,Platform
} from 'react-native';
import Utils from "./common/Utils";
import Config from "./common/Config";
import {Styles, CSpinner, LoadSVG, LoadImages} from './common';
import Services from './common/Services';
import OfflineNotice from './common/OfflineNotice';
import {Appbar, DefaultTheme, List, TextInput, Button, Searchbar} from "react-native-paper";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import QRCodeScanner from "react-native-qrcode-scanner";
import {bindActionCreators} from "redux";
import {ActionSignUp} from "./Store/Actions/SignUpAction";
import {connect} from "react-redux";
import {PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import {RNCamera} from "react-native-camera";
import RNDateTimePicker from "react-native-date-picker";

const theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        text: '#233167',
        primary: '#233167', fontWeight: 'bold'
    },

};

const VehicleTheme = {
    ...DefaultTheme,
    fonts: {
        ...DefaultTheme.fonts,
        regular: 'Muli-Regular',
    },
};


class SignupScreen extends React.Component {

    userdata = {};
    vehicleRegistrationNumber = {part1: '', part2: '', part3: '', part4: ''};

    constructor(props) {
        super(props);
        this.requestCameraPermission();
        this.keyboardWillShow = this.keyboardWillShow.bind(this)
        this.keyboardWillHide = this.keyboardWillHide.bind(this)
    };


    componentDidMount() {
        this.keyboardWillShowSub = Keyboard.addListener('keyboardDidShow', this.keyboardWillShow);
        this.keyboardWillHideSub = Keyboard.addListener('keyboardDidHide', this.keyboardWillHide);
        this.getAllCitiesClientsSites();
    }

    componentWillUnmount() {
        this.keyboardWillShowSub.remove();
        this.keyboardWillHideSub.remove();
    }

    keyboardWillShow = event => {
        this.setState({
            KeyboardVisible: false
        });
    };

    keyboardWillHide = event => {
        this.setState({
            KeyboardVisible: true
        });
    };

    renderSpinner() {
        if (this.props.SignupState.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    async requestCameraPermission() {
        try {
            const granted = request(Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA).then((result) => {
                if ('granted' === result) {
                    this.props.getActionSignUp({QRVisible: true, granted: granted})
                } else {
                    Utils.dialogBox('Camera permission denied', '');
                    this.props.navigation.goBack();
                }
            });
        } catch (err) {
            Utils.dialogBox('err', '');
            console.warn(err);
        }
    }

    errorHandling(error) {
        const self = this;
        if (error.response) {
            if (error.response.status === 403) {
                self.props.getActionSignUp({spinnerBool: false});
                Utils.dialogBox("Token Expired,Please Login Again", '');
                self.props.navigation.navigate('Login');
            } else if (error.response.status === 500) {
                self.props.getActionSignUp({spinnerBool: false});
                if (error.response.data.message) {
                    Utils.dialogBox(error.response.data.message, '');
                } else {
                    Utils.dialogBox(error.response.data[0], '');
                }
            } else if (error.response.status === 400) {
                self.props.getActionSignUp({spinnerBool: false});
                if (error.response.data.message) {
                    Utils.dialogBox(error.response.data.message, '');
                } else {
                    Utils.dialogBox(error.response.data[0], '');
                }
            } else if (error.response.status === 413) {
                self.props.getActionSignUp({spinnerBool: false});
                Utils.dialogBox('Request Entity Too Large', '');
            } else if (error.response.status === 404) {
                self.props.getActionSignUp({spinnerBool: false});
                    Utils.dialogBox(error.response.data.error, '');
            } else {
                self.props.getActionSignUp({spinnerBool: false});
                Utils.dialogBox("Error loading Shift Data, Please contact Administrator ", '');
            }
        } else {
            self.props.getActionSignUp({spinnerBool: false});
            Utils.dialogBox(error.message, '');
        }
    }


    getSingupRolesList = (siteId) => {
        const self = this;
        let tempId = siteId === 'No Site' ? '' : siteId
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_SIGNUP_ROLES_LIST + 'siteId=' + tempId;
        const body = {};
        this.props.getActionSignUp({spinnerBool: true})
        Services.NoAuthHTTPRequest(apiUrl, 'GET', body, function (response) {
            if (response.status === 200) {
                self.props.getActionSignUp({userRoles: response.data, userRolePopup: true, spinnerBool: false})
            }
        }, function (error) {
            self.errorHandling(error);
        })

    };

    getAllCitiesClientsSites = () => {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_CITIES_SITES_CLIENTS_NOAUTH;
        const body = JSON.stringify({siteId: this.props.SignupState.siteId});
        this.props.getActionSignUp({spinnerBool: true})
        Services.NoAuthHTTPRequestinData(apiUrl, 'POST', body, function (response) {
            if (response.status === 200) {
                //  this.props.getActionSignUp({spinnerBool:false})

                let data = response.data;
                let allCities = data.citiesList;
                let allSites = data.sitesList;
                let allClients = data.clientsList;
                self.props.getActionSignUp({
                    CitiesData: data.citiesList,
                    cities: allCities,
                    sites: allSites,
                    clients: allClients,
                    spinnerBool: false
                });
            }
        }, function (error) {
            self.errorHandling(error);
        })
    };


    //GET HIRING MANAGERS LIST
    FetchHiringManagers() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_HIRING_MANAGERS_LIST + this.props.SignupState.siteId;
        const body = {};
        this.props.getActionSignUp({spinnerBool: true})
        Services.NoAuthHTTPRequest(apiUrl, 'GET', body, function (response) {
            if (response.status === 200) {
                self.props.getActionSignUp({
                    HiringManagerList: response.data.hiringManagers,
                    showHiringManagerModal: true,
                    spinnerBool: false
                });
            }
        }, function (error) {
            self.errorHandling(error);
        })

    }

    /* get Sites by CityId */
    getSitesByCity = (cityId) => {
        let sitesByCity = [];
        const noSite = {attrs: {siteLable: 'No Site'}};
        noSite.name = 'No Site';
        noSite.id = 'No Site';
        noSite.siteCode = 'No Site';
        noSite.businessUnit = '';
        sitesByCity.push(noSite);
        for (let i = 0; i < this.props.SignupState.sites.length; i++) {
            if (cityId === this.props.SignupState.sites[i].cityId) {
                sitesByCity.push(this.props.SignupState.sites[i]);
            }
        }
        this.props.getActionSignUp({sitesByCity: sitesByCity, sitesByCityData: sitesByCity, showSites: true})
    };

    /*  clients by SiteId */
    getClientsBySite = (siteId) => {
        let clientsBySite = [];
        for (let i = 0; i < this.props.SignupState.clients.length; i++) {
            if (siteId === this.props.SignupState.clients[i].siteId) {
                clientsBySite.push(this.props.SignupState.clients[i]);
            }
        }
        this.props.getActionSignUp({clientsBySite: clientsBySite, showClients: true})
    };

    /* API call for SignUp */
    httpSignUpRequest() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.POST_SIGNUP;
        const body = JSON.stringify(this.userdata);
        this.props.getActionSignUp({spinnerBool: true})
        Services.NoAuthHTTPRequestinData(apiUrl, 'POST', body, function (response) {
            if (response.status === 200) {
                // console.log('signup rep200', response)
                let result = response.data;
                let token = result.accessToken.accessToken;
                let tokenType = result.accessToken.tokenType;
                let accessToken = tokenType + " " + token;
                Utils.dialogBox(result.message, '');
                Utils.setToken('token', accessToken, function () {
                });
                // Utils.setToken('userStatus', result.status, function () {
                // });
                Utils.setToken('userStatus', 'ACTIVATION_PENDING', function () {
                });
                self.props.getActionSignUp({spinnerBool: false});
                self.props.navigation.navigate('authNavigator');
            }
        }, function (error) {
            self.errorHandling(error);
        })

    };

    openDatePicker = () => {
        const self = this;
        try {
            const {action, year, month, day} = DatePickerAndroid.open({
                date: self.props.SignupState.dateOfBirth ? new Date(self.props.SignupState.dateOfBirth) : new Date(),
                // minDate: new Date()
                mode: 'spinner',
                maxDate: new Date(),
            }).then((response) => {
                if (response.action === "dateSetAction") {
                    let tempDate = new Date(response.year, response.month, response.day).toJSON()

                    let resp = {};
                    resp = Utils.isValidDOB(tempDate);
                    if (resp.status === true) {
                        this.userdata.dateOfBirth = tempDate;
                        this.signupValidation()
                        this.props.getActionSignUp({dateOfBirth: tempDate, isValidDOB: true, errorDobMessage: null});
                    } else {
                        this.props.getActionSignUp({isValidDOB: false, errorDobMessage: resp.message})
                    }
                }
            });
        } catch ({code, message}) {
            console.warn('Cannot open date picker', message);
        }
    }

    setDateTimePicker = (event, date) => {
        let selectedTimestamp = event.nativeEvent.timestamp
        let tempDate = new Date(selectedTimestamp)
        let shiftDate = new Date()
        shiftDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate())



        let resp = {};
        resp = Utils.isValidDOB(shiftDate);
        if (resp.status === true) {
            this.userdata.dateOfBirth = shiftDate;
            this.signupValidation()
            this.props.getActionSignUp({dateOfBirth: shiftDate, isValidDOB: true, errorDobMessage: null,showDateTimepicker:false});
        } else {
            this.props.getActionSignUp({dateOfBirth: shiftDate,isValidDOB: false, errorDobMessage: resp.message,showDateTimepicker:false})
        }
    };

    searchCity = (value) => {
        if (value === '') {
            this.getAllCitiesClientsSites();
        } else {
            let filteredData = this.props.SignupState.CitiesData.filter(function (item) {
                return item.name.toUpperCase().includes(value.toUpperCase());
            });
            this.props.getActionSignUp({cities: filteredData});
        }
    }

    barcodeReceived(e) {
        const self = this;
        if (e) {
            if (e.data && e.data != null) {
                Vibration.vibrate();
                const sitesList = this.props.SignupState.sitesByCity;
                for (let i = 0; i < sitesList.length; i++) {
                    if (sitesList[i].qrcode === e.data && sitesList[i].siteCode !== "No Site") {
                        self.props.getActionSignUp({
                                siteId: sitesList[i].qrcode,
                                siteName: sitesList[i].name,
                                siteCode: sitesList[i].siteCode,
                                siteBussinessUnit: sitesList[i].businessUnit,
                                showQRModal: false,
                                HiringManagerName: '',
                                HiringManagerId: '',
                                invalidQR: false
                            },
                            // this.verifySelectSite(sitesList[i].name)
                            this.userdata.siteId = sitesList[i].qrcode,
                            this.signupValidation()
                        )
                    } else {
                        this.props.getActionSignUp({invalidQR: true})
                    }
                }
            } else {
                Utils.dialogBox('Invalid QR scanned', '');
            }
        }
    }

    searchSite(value) {
        if (value === '') {
            this.getSitesByCity(this.props.SignupState.cityId);
        } else {
            let filteredData = this.props.SignupState.sitesByCityData.filter(function (item) {
                if (item.attrs.siteLable) {
                    return (item.attrs.siteLable).toUpperCase().includes(value.toUpperCase());
                }
            });
            this.props.getActionSignUp({sitesByCity: filteredData});
        }

    }

    signupValidation(button) {
        let stateCollection = this.props.SignupState;
        let stateActions = this.props.getActionSignUp;
        let userdata = this.userdata
        let resp;
        resp = Utils.isValidMobileNumber(userdata.phoneNumber)
        if (resp.status === true) {
            stateActions({
                signupPhoneNumber: userdata.phoneNumber,
                isValidSignUpMobileNumber: true,
                errorSignupMobileMessage: null
            });
            this.userdata.phoneNumber = userdata.phoneNumber;
            resp = Utils.isValidNoun(userdata.fullName)
            if (resp.status === true) {
                stateActions({fullName: userdata.fullName, isValidFullName: true, errorNameMessage: null});
                this.userdata.fullName = userdata.fullName;
                resp = Utils.isValidEmail(userdata.email);
                if (resp.status === true) {
                    this.userdata.email = resp.message;
                    stateActions({email: resp.message, isValidEmail: true, errorEmailMessage: null});
                    resp = Utils.isValidDOB(userdata.dateOfBirth);
                    if (resp.status === true) {
                        this.userdata.dateOfBirth = new Date(userdata.dateOfBirth).toJSON();
                        stateActions({dateOfBirth: userdata.dateOfBirth, isValidDOB: true, errorDobMessage: null});

                        this.otherValidations(button)

                    } else {
                        stateActions({isValidDOB: false, errorDobMessage: resp.message});
                    }
                } else {
                    stateActions({isValidEmail: false, errorEmailMessage: resp.message});
                }
            } else {
                stateActions({isValidFullName: false, errorNameMessage: resp.message});
            }

        } else {
            stateActions({isValidSignUpMobileNumber: false, errorSignupMobileMessage: resp.message});
        }
    }

    otherValidations(button) {
        let stateCollection = this.props.SignupState;
        let stateActions = this.props.getActionSignUp;
        let userdata = this.userdata
        let resp = {};
        {
            userdata.hiringManagerId = stateCollection.HiringManagerId ? stateCollection.HiringManagerId : null
        }
        resp = Utils.isValueSelected(userdata.cityId, 'Please Select a City');
        if (resp.status === true) {
            userdata.cityId = resp.message;
            stateActions({isValidCity: true, errorCityMessage: null});
            resp = Utils.isValueSelected(userdata.siteId, 'Please Select a Site');
            if (resp.status === true) {
                userdata.siteId = resp.message;
                stateActions({isValidSite: true, errorSiteMessage: null});
                if (userdata.siteId === 'No Site') {
                    resp = Utils.isValidAddress(userdata.preferredSiteLocation);
                    if (resp.status === true) {
                        userdata.preferredSiteLocation = resp.message;
                        stateActions({isValidLocation: true, errorLocationMessage: null});

                        this.vehicleValidations(button)

                    } else {
                        stateActions({isValidLocation: false, errorLocationMessage: 'Please enter the Location'});
                    }
                } else {
                    this.vehicleValidations(button)
                }
            } else {
                stateActions({isValidSite: false, errorSiteMessage: resp.message});
            }
        } else {
            stateActions({isValidCity: false, errorCityMessage: resp.message});
        }
    }

    vehicleValidations(button) {
        let stateCollection = this.props.SignupState;
        let stateActions = this.props.getActionSignUp;
        let userdata = this.userdata
        let vehicleRegistrationNumber = this.vehicleRegistrationNumber
        let resp;

        resp = Utils.isValueSelected(userdata.userRole, 'Please select a Role');
        if (resp.status === true) {
            userdata.userRole = resp.message;
            stateActions({isValidRole: true, errorRoleMessage: null});
            if (userdata.userRole === 'DRIVER' || userdata.userRole === 'DRIVER_AND_ASSOCIATE') {
                resp = Utils.isValueSelected(userdata.vehicleType, 'Please Select Vehicle Type')
                if (resp.status === true) {
                    userdata.vehicleType = resp.message;
                    stateActions({isValidVehicleType: true, errorVehicleTypeMessage: null});
                    resp = Utils.ValidateTotalVehicleNumberinParts(vehicleRegistrationNumber.part1, vehicleRegistrationNumber.part2, vehicleRegistrationNumber.part3, vehicleRegistrationNumber.part4);
                    if (resp.status === true) {
                        // userdata.vehicleRegNoInParts={
                        //     part1: stateCollection.part1,
                        //     part2: stateCollection.part2,
                        //     part3: stateCollection.part3,
                        //     part4: stateCollection.part4}
                        userdata.vehicleRegNoInParts = vehicleRegistrationNumber
                        stateActions({
                            errorFinalVehicleNumber: null,
                            isValidVehicleRegNo: true,
                            errorVehicleRegMessage: null
                        });

                        if (button === 'onClickSave') {
                            this.httpSignUpRequest()
                        }

                    } else {
                        stateActions({
                            isValidVehicleRegNo: false,
                            errorFinalVehicleNumber: resp.message,
                            errorVehicleRegMessage: resp.message,
                        });
                    }
                } else {
                    stateActions({isValidVehicleType: false, errorVehicleTypeMessage: resp.message,});
                }
            } else {
                if (button === 'onClickSave') {
                    this.httpSignUpRequest()
                }
            }
        } else {
            stateActions({isValidRole: false, errorRoleMessage: resp.message});
        }
    }

    render() {
        let stateCollection = this.props.SignupState;
        let stateActions = this.props.getActionSignUp;
        let vehicleRegistrationNumber = this.vehicleRegistrationNumber;
        return (
            <View style={[{flex: 1, textAlign: 'center', backgroundColor: '#fff', color: 'red',}]}>
                <OfflineNotice/>
                {this.renderSpinner()}
                <Appbar.Header style={[Styles.bgWhite, Styles.mTop15]}>
                    <Appbar.Action icon='chevron-left' size={45} color='#233167' onPress={() => {
                        this.props.navigation.goBack()
                    }}/>
                    {LoadSVG.whizzard_logo}
                </Appbar.Header>
                <ScrollView
                    // persistentScrollbar={true}
                    style={[Styles.marH20]}>
                    <KeyboardAvoidingView style={{flex: 1}}>
                        <View style={{marginTop: 10, marginBottom: 15}}>
                            <Text style={[Styles.colorBlue, Styles.f28, Styles.ffMbold]}>
                                Welcome,
                            </Text>
                            <Text style={[Styles.colorBlue, Styles.f25, Styles.ffMregular]}>
                                Sign up to continue
                            </Text>
                        </View>

                        {/*MOBILE NUMBER VIEW*/}
                        <View style={{marginBottom: 10}}>
                            <TextInput label='Mobile Number *'
                                       placeholder={'Type here'}
                                       mode='outlined'
                                       theme={theme}
                                       returnKeyType={"next"}
                                       blurOnSubmit={false}
                                       placeholderTextColor='red'
                                       keyboardType='numeric'
                                       ref={(input) => {
                                           this.phoneNumber = input;
                                       }}
                                       onSubmitEditing={() => {
                                           this.fullName.focus();
                                       }}
                                       onChangeText={(value) => {
                                           let resp;
                                           resp = Utils.isValidMobileNumber(value)
                                           if (resp.status === true) {
                                               this.userdata.phoneNumber = value;
                                               this.signupValidation()
                                               stateActions({
                                                   signupPhoneNumber: value,
                                                   isValidSignUpMobileNumber: true,
                                                   errorSignupMobileMessage: null
                                               });
                                           } else {
                                               stateActions({
                                                   signupPhoneNumber: value,
                                                   isValidSignUpMobileNumber: false,
                                                   errorSignupMobileMessage: resp.message
                                               });
                                           }
                                       }}
                                       value={stateCollection.signupPhoneNumber}/>
                            {
                                stateCollection.errorSignupMobileMessage ?
                                    Services.returnTextInputErrorMessage(stateCollection.errorSignupMobileMessage)
                                    :
                                    null
                            }
                            {
                                stateCollection.isValidSignUpMobileNumber === true ?
                                    Services.successIcon()
                                    :
                                    stateCollection.isValidSignUpMobileNumber === false ?
                                        Services.errorIcon()
                                        : null
                            }
                        </View>
                        {/*FULL NAME VIEW*/}
                        <View style={{marginBottom: 10}}>
                            <TextInput label='Full Name*'
                                       placeholder={'Type here'}
                                       theme={theme}
                                       mode='outlined'
                                       autoCompleteType='off'
                                       placeholderTextColor='#233167'
                                       autoCapitalize="none"
                                       blurOnSubmit={false}
                                       returnKeyType={"next"}
                                       ref={(input) => {
                                           this.fullName = input;
                                       }}
                                       onSubmitEditing={() => {
                                           this.email.focus();
                                       }}
                                       onChangeText={(value) => {
                                           let resp;
                                           resp = Utils.isValidNoun(value)
                                           if (resp.status === true) {
                                               this.userdata.fullName = value;
                                               this.signupValidation()
                                               stateActions({
                                                   fullName: value,
                                                   isValidFullName: true,
                                                   errorNameMessage: null
                                               });
                                           } else {
                                               stateActions({
                                                   fullName: value,
                                                   isValidFullName: false,
                                                   errorNameMessage: resp.message
                                               });
                                           }
                                       }}
                                       value={stateCollection.fullName}/>
                            {
                                stateCollection.errorNameMessage ?
                                    Services.returnTextInputErrorMessage(stateCollection.errorNameMessage)
                                    :
                                    null
                            }
                            {stateCollection.isValidFullName === true ?
                                Services.successIcon()
                                :
                                stateCollection.isValidFullName === false ?
                                    Services.errorIcon() : null
                            }
                        </View>

                        {/*Email VIEW*/}
                        <View style={{marginBottom: 10}}>
                            <TextInput label='Email*'
                                       placeholder={'Type here'}
                                       theme={theme}
                                       mode='outlined'
                                       autoCompleteType='off'
                                       placeholderTextColor='#233167'
                                       autoCapitalize="none"
                                       blurOnSubmit={false}
                                       returnKeyType={"done"}
                                       ref={(input) => {
                                           this.email = input;
                                       }}
                                       onSubmitEditing={() => {
                                           Keyboard.dismiss();
                                       }}
                                       onChangeText={(value) => {
                                           let resp;
                                           resp = Utils.isValidEmail(value)
                                           if (resp.status === true) {
                                               this.userdata.email = value;
                                               this.signupValidation()
                                               stateActions({
                                                   email: value,
                                                   isValidEmail: true,
                                                   errorEmailMessage: null
                                               });
                                           } else {
                                               stateActions({
                                                   email: value,
                                                   isValidEmail: false,
                                                   errorEmailMessage: resp.message
                                               });
                                           }
                                       }}
                                       value={stateCollection.email}/>
                            {
                                this.props.SignupState.errorEmailMessage ?
                                    Services.returnTextInputErrorMessage(stateCollection.errorEmailMessage)
                                    :
                                    null
                            }
                            {this.props.SignupState.isValidEmail === true ?
                                Services.successIcon()
                                :
                                this.props.SignupState.isValidEmail === false ?
                                    Services.errorIcon() : null
                            }
                        </View>

                        {/*USER DOB*/}
                        <TouchableOpacity
                            // onPress={() => { this.openDatePicker() }}
                            onPress={() => { stateActions({showDateTimepicker:true})}}
                                          style={{marginBottom: 10}}>
                            <View pointerEvents='none'>
                                <TextInput label='Date of Birth *'
                                           showSoftInputOnFocus={true}
                                           editable={false}
                                           theme={theme}
                                           onFocus={() => {
                                               Keyboard.dismiss()
                                           }}
                                           mode='outlined'
                                           placeholderTextColor='#233167'
                                           blurOnSubmit={false}
                                           value={stateCollection.dateOfBirth ? new Date(stateCollection.dateOfBirth).toDateString() : 'Select DOB'}
                                />
                                {
                                    stateCollection.errorDobMessage ?
                                        Services.returnTextInputErrorMessage(stateCollection.errorDobMessage)
                                        :
                                        null
                                }
                            </View>
                            <MaterialIcons name='date-range' color='#9e9e9e' size={35}
                                           style={{position: 'absolute', right: 15, top: 18}}/>
                        </TouchableOpacity>

                        {
                            this.props.SignupState.showDateTimepicker === true
                                ?
                                <RNDateTimePicker
                                    style={[Styles.bgLBlueMix]}
                                    mode={'date'}
                                    value={new Date(stateCollection.dateOfBirth)}
                                    onChange={this.setDateTimePicker}
                                    maximumDate= {new Date()}
                                />
                                :
                                null
                        }


                        {/*CITY VIEW*/}
                        <TouchableOpacity onPress={() => {
                            stateActions({cityPopup: true})
                        }}>
                            <View pointerEvents='none'>
                                <TextInput label='Select City*'
                                           theme={theme}
                                    // contextMenuHidden={true}
                                           editable={false}
                                           onFocus={() => {
                                               Keyboard.dismiss()
                                           }}
                                           mode='outlined'
                                           autoCompleteType='off'
                                           placeholderTextColor='#233167'
                                           blurOnSubmit={false}
                                           value={stateCollection.cityName}
                                />
                            </View>
                            <MaterialIcons name='expand-more' color='#9e9e9e' size={35}
                                           style={{position: 'absolute', right: 15, top: 18}}/>
                        </TouchableOpacity>
                        <View style={{marginBottom: 10}}>
                            {
                                stateCollection.errorCityMessage ?
                                    Services.returnTextInputErrorMessage(stateCollection.errorCityMessage)
                                    :
                                    null
                            }
                        </View>

                        {/*SITE VIEW*/}
                        {
                            stateCollection.showSites === true ?
                                <View style={[Styles.row]}>
                                    <TouchableOpacity
                                        style={[Styles.flex1]}
                                        onPress={() => {
                                            stateActions({sitePopup: true})
                                        }}>
                                        <View pointerEvents='none'>
                                            <TextInput label='Select Site*'
                                                // contextMenuHidden={true}
                                                       editable={false}
                                                       theme={theme}
                                                       onFocus={() => {
                                                           Keyboard.dismiss()
                                                       }}
                                                       style={[Styles.f16]}
                                                       multiline={true}
                                                       mode='outlined'
                                                       autoCompleteType='off'
                                                       placeholderTextColor='#233167'
                                                       blurOnSubmit={false}
                                                       value={stateCollection.siteName ? stateCollection.siteCode + ('-' + stateCollection.siteBussinessUnit) + ' ' + '(' + stateCollection.siteName + ')' : stateCollection.siteName}
                                            />
                                        </View>
                                        <MaterialIcons name='expand-more' color='#9e9e9e' size={35}
                                                       style={{position: 'absolute', right: 15, top: 18}}/>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[Styles.row, Styles.marH10, Styles.aslCenter]}
                                        onPress={() => {
                                            stateActions({QRVisible: true, showQRModal: true})
                                        }}>
                                        <FontAwesome name="qrcode" size={30} color="#233167" />
                                    </TouchableOpacity>
                                </View>
                                : null
                        }
                        <View style={{marginBottom: 10}}>
                            {
                                stateCollection.errorSiteMessage ?
                                    Services.returnTextInputErrorMessage(stateCollection.errorSiteMessage)
                                    :
                                    null
                            }
                        </View>


                        {/*No Site View*/}
                        {stateCollection.siteId === 'No Site' ?
                            <View style={{marginBottom: 10}}>
                                <TextInput label='Enter site location*'
                                           placeholder={'Type here'}
                                           theme={theme}
                                           mode='outlined'
                                           autoCompleteType='off'
                                           placeholderTextColor='#233167'
                                           autoCapitalize="none"
                                           blurOnSubmit={false}
                                           returnKeyType={"done"}
                                           value={stateCollection.preferredSiteLocation}
                                           onSubmitEditing={() => {
                                               Keyboard.dismiss();
                                           }}
                                           onChangeText={(value) => {
                                               let resp = {};
                                               if (this.userdata.siteId === 'No Site') {
                                                   resp = Utils.isValidAddress(value);
                                                   if (resp.status === true) {
                                                       this.userdata.preferredSiteLocation = value;
                                                       this.signupValidation()
                                                       stateActions({
                                                           preferredSiteLocation: value,
                                                           isValidLocation: true,
                                                           errorLocationMessage: null
                                                       });
                                                   } else {
                                                       this.props.getActionSignUp({
                                                           preferredSiteLocation: value,
                                                           isValidLocation: false,
                                                           errorLocationMessage: 'Please enter the Location'
                                                       });
                                                   }
                                               }
                                           }}
                                />
                                {
                                    stateCollection.errorLocationMessage ?
                                        Services.returnTextInputErrorMessage(stateCollection.errorLocationMessage)
                                        :
                                        null
                                }
                                {stateCollection.isValidLocation === true ?
                                    Services.successIcon()
                                    :
                                    stateCollection.isValidLocation === false ?
                                        Services.errorIcon() : null
                                }
                            </View> : null}


                        {/*No Site View*/}
                        {stateCollection.siteId === '' || stateCollection.siteId === 'No Site'
                            ?
                            null
                            :
                            <TouchableOpacity onPress={() => {
                                this.FetchHiringManagers()
                            }}>
                                <View pointerEvents='none'>
                                    <TextInput label='Select Hiring Manager'
                                               editable={false}
                                               theme={theme}
                                               onFocus={() => {
                                                   Keyboard.dismiss()
                                               }}
                                               mode='outlined'
                                               autoCompleteType='off'
                                               placeholderTextColor='#233167'
                                               blurOnSubmit={false}
                                               value={stateCollection.HiringManagerName}
                                    />
                                </View>
                                <MaterialIcons name='expand-more' color='#9e9e9e' size={35}
                                               style={{position: 'absolute', right: 15, top: 18}}/>
                            </TouchableOpacity>
                        }

                        {/*ROLES SET*/}
                        {
                            stateCollection.siteId
                                ?
                                <View>

                                    {/*USER ROLE VIEW*/}
                                    <TouchableOpacity onPress={() => {
                                        this.getSingupRolesList(stateCollection.siteId)
                                        // this.setState({userRolePopup: true})
                                    }}>
                                        <View pointerEvents='none'>
                                            <TextInput label='Select Role*'
                                                       showSoftInputOnFocus={true}
                                                       editable={false}
                                                       theme={theme}
                                                       onFocus={() => {
                                                           Keyboard.dismiss()
                                                       }}
                                                       mode='outlined'
                                                       placeholderTextColor='#233167'
                                                       blurOnSubmit={false}
                                                       value={stateCollection.userRoleName}
                                            />
                                        </View>
                                        <MaterialIcons name='expand-more' color='#9e9e9e' size={35}
                                                       style={{position: 'absolute', right: 15, top: 18}}/>
                                    </TouchableOpacity>
                                    <View style={{marginBottom: 10}}>
                                        {
                                            stateCollection.errorRoleMessage ?
                                                Services.returnTextInputErrorMessage(stateCollection.errorRoleMessage)
                                                :
                                                null
                                        }
                                    </View>

                                    {/*Vehicle Type Only for Roles Driver and DDA*/}
                                    {
                                        stateCollection.userRole === 'DRIVER' || stateCollection.userRole === 'DRIVER_AND_ASSOCIATE'
                                            ?
                                            <View>
                                                <TouchableOpacity onPress={() => {
                                                    stateActions({vehicleTypeModal: true})
                                                }}>
                                                    <View pointerEvents='none'>
                                                        <TextInput label='Select Vehicle Type*'
                                                                   showSoftInputOnFocus={true}
                                                                   editable={false}
                                                                   theme={theme}
                                                                   onFocus={() => {
                                                                       Keyboard.dismiss()
                                                                   }}
                                                                   mode='outlined'
                                                                   placeholderTextColor='#233167'
                                                                   blurOnSubmit={false}
                                                                   value={stateCollection.vehicleTypeName}
                                                        />
                                                    </View>
                                                    <MaterialIcons name='expand-more' color='#9e9e9e' size={35}
                                                                   style={{
                                                                       position: 'absolute',
                                                                       right: 15,
                                                                       top: 18
                                                                   }}/>
                                                </TouchableOpacity>
                                                <View style={{marginBottom: 10}}>
                                                    {
                                                        stateCollection.errorVehicleTypeMessage ?
                                                            Services.returnTextInputErrorMessage(stateCollection.errorVehicleTypeMessage)
                                                            :
                                                            null
                                                    }

                                                </View>
                                            </View> : null
                                    }
                                    {(stateCollection.userRole === 'DRIVER' || stateCollection.userRole === 'DRIVER_AND_ASSOCIATE') && stateCollection.vehicleType ?
                                        <View style={[{marginBottom: 10}]}>
                                            <Text style={[Styles.ffMregular, Styles.f16, {color: '#233167'}]}>Enter
                                                Vehicle
                                                Number (AA 12 AA 1234)*</Text>
                                            <View style={[Styles.row]}>
                                                <TextInput
                                                    theme={theme}
                                                    style={[{textTransform: 'uppercase'}, Styles.aslCenter, Styles.padH5]}
                                                    autoCapitalize='characters'
                                                    // placeholder='AA'
                                                    mode='outlined'
                                                    autoCompleteType='off'
                                                    // placeholderTextColor='#233167'
                                                    blurOnSubmit={false}
                                                    maxLength={2}
                                                    returnKeyType={"next"}
                                                    ref={(input) => {
                                                        this.part1 = input;
                                                    }}
                                                    onSubmitEditing={() => {
                                                        this.part2.focus();
                                                    }}
                                                    value={stateCollection.part1}
                                                    // onChangeText={(part1) => stateActions({part1}, this.verifyVehicleNumberInput1(part1))}/>
                                                    onChangeText={(part1) => {
                                                        vehicleRegistrationNumber.part1 = part1
                                                        let resp;
                                                        resp = Utils.ValidateTotalVehicleNumberinParts(part1, vehicleRegistrationNumber.part2, vehicleRegistrationNumber.part3, vehicleRegistrationNumber.part4);
                                                        if (resp.status === true) {
                                                            stateActions({
                                                                part1: part1,
                                                                errorFinalVehicleNumber: null,
                                                                isValidVehicleRegNo: true
                                                            });
                                                            this.userdata.vehicleRegNoInParts = vehicleRegistrationNumber
                                                            this.signupValidation()
                                                            // this.part2.focus();
                                                        } else {
                                                            this.props.getActionSignUp({
                                                                part1: part1,
                                                                errorFinalVehicleNumber: resp.message
                                                            });
                                                        }
                                                    }}/>
                                                <Text
                                                    style={[Styles.f28, Styles.cBlk, Styles.ffMbold, Styles.aslCenter]}> - </Text>
                                                <TextInput
                                                    theme={theme}
                                                    style={[{textTransform: 'uppercase'}, Styles.aslCenter, Styles.padH5]}
                                                    mode='outlined'
                                                    // placeholder='12'
                                                    autoCompleteType='off'
                                                    // placeholderTextColor='#233167'
                                                    autoCapitalize="characters"
                                                    blurOnSubmit={false}
                                                    // keyboardType='numeric'
                                                    maxLength={2}
                                                    returnKeyType={"next"}
                                                    ref={(input) => {
                                                        this.part2 = input;
                                                    }}
                                                    onSubmitEditing={() => {
                                                        this.part3.focus();
                                                    }}
                                                    value={stateCollection.part2}
                                                    onChangeText={(part2) => {
                                                        vehicleRegistrationNumber.part2 = part2
                                                        let resp;
                                                        resp = Utils.ValidateTotalVehicleNumberinParts(vehicleRegistrationNumber.part1, part2, vehicleRegistrationNumber.part3, vehicleRegistrationNumber.part4);
                                                        if (resp.status === true) {
                                                            stateActions({
                                                                part2: part2,
                                                                errorFinalVehicleNumber: null,
                                                                isValidVehicleRegNo: true
                                                            });
                                                            this.userdata.vehicleRegNoInParts = vehicleRegistrationNumber
                                                            this.signupValidation()
                                                            // this.part3.focus();
                                                        } else {
                                                            this.props.getActionSignUp({
                                                                part2: part2,
                                                                errorFinalVehicleNumber: resp.message
                                                            });
                                                        }
                                                    }}/>
                                                <Text
                                                    style={[Styles.f28, Styles.cBlk, Styles.ffMbold, Styles.aslCenter]}> - </Text>
                                                <TextInput
                                                    theme={theme}
                                                    style={[{textTransform: 'uppercase',}, Styles.aslCenter, Styles.padH5]}
                                                    // placeholder='AA'
                                                    mode='outlined'
                                                    autoCompleteType='off'
                                                    // placeholderTextColor='#233167'
                                                    autoCapitalize="characters"
                                                    blurOnSubmit={false}
                                                    maxLength={2}
                                                    returnKeyType={"next"}
                                                    ref={(input) => {
                                                        this.part3 = input;
                                                    }}
                                                    onSubmitEditing={() => {
                                                        this.part4.focus();
                                                    }}
                                                    value={stateCollection.part3}
                                                    onChangeText={(part3) => {
                                                        vehicleRegistrationNumber.part3 = part3
                                                        let resp;
                                                        resp = Utils.ValidateTotalVehicleNumberinParts(vehicleRegistrationNumber.part1, vehicleRegistrationNumber.part2, part3, vehicleRegistrationNumber.part4);
                                                        if (resp.status === true) {
                                                            stateActions({
                                                                part3: part3,
                                                                errorFinalVehicleNumber: null,
                                                                isValidVehicleRegNo: true
                                                            });
                                                            this.userdata.vehicleRegNoInParts = vehicleRegistrationNumber
                                                            this.signupValidation()
                                                            this.part4.focus();
                                                        } else {
                                                            this.props.getActionSignUp({
                                                                part3: part3,
                                                                errorFinalVehicleNumber: resp.message
                                                            });
                                                        }
                                                    }}/>
                                                <Text
                                                    style={[Styles.f28, Styles.cBlk, Styles.ffMbold, Styles.aslCenter]}> - </Text>
                                                <TextInput
                                                    theme={theme}
                                                    style={[{textTransform: 'uppercase'}, Styles.aslCenter, Styles.padH15]}
                                                    // placeholder='1234'
                                                    keyboardType='numeric'
                                                    mode='outlined'
                                                    autoCompleteType='off'
                                                    // placeholderTextColor='#233167'
                                                    maxLength={4}
                                                    autoCapitalize="characters"
                                                    blurOnSubmit={false}
                                                    returnKeyType={"done"}
                                                    ref={(input) => {
                                                        this.part4 = input;
                                                    }}
                                                    onSubmitEditing={() => {
                                                        Keyboard.dismiss();
                                                    }}
                                                    value={stateCollection.part4}
                                                    onChangeText={(part4) => {
                                                        vehicleRegistrationNumber.part4 = part4
                                                        let resp;
                                                        resp = Utils.ValidateTotalVehicleNumberinParts(vehicleRegistrationNumber.part1, vehicleRegistrationNumber.part2, vehicleRegistrationNumber.part3, part4);
                                                        if (resp.status === true) {
                                                            stateActions({
                                                                part4: part4,
                                                                errorFinalVehicleNumber: null,
                                                                isValidVehicleRegNo: true
                                                            });
                                                            this.userdata.vehicleRegNoInParts = vehicleRegistrationNumber
                                                            this.signupValidation()
                                                        } else {
                                                            this.props.getActionSignUp({
                                                                part4: part4,
                                                                errorFinalVehicleNumber: resp.message
                                                            });
                                                        }
                                                    }}/>
                                            </View>
                                            {
                                                stateCollection.errorFinalVehicleNumber ?
                                                    Services.returnTextInputErrorMessage(stateCollection.errorFinalVehicleNumber)
                                                    :
                                                    null
                                            }
                                        </View>
                                        : null}

                                </View>
                                :
                                null
                        }


                        {/*MODAL for Site Scan QR*/}
                        <Modal transparent={true}
                               visible={stateCollection.showQRModal}
                               animated={true}
                               animationType='slide'
                               onRequestClose={() => {
                                   stateActions({showQRModal: false})
                               }}>
                            <View style={[Styles.modalfrontPosition]}>
                                <View
                                    style={[[Styles.bw1, Styles.aslCenter, Styles.bgWhite, Styles.p15, Styles.br40, Styles.bgWhite, {
                                        width: Dimensions.get('window').width - 80,
                                        height: Dimensions.get('window').height - 220,
                                    }]]}>

                                    {
                                        stateCollection.granted && stateCollection.QRVisible === true
                                            ?
                                            Platform.OS === 'ios'
                                                ?
                                                <View style={{flex: 1,flexDirection: 'column', backgroundColor: 'black',}}>
                                                    <RNCamera
                                                        style={{flex: 1,justifyContent: 'flex-end',alignItems: 'center',}}
                                                        type={RNCamera.Constants.Type.back}
                                                        onGoogleVisionBarcodesDetected={()=>{console.log('bar code detected')}}
                                                        onBarCodeRead={(data)=>this.barcodeReceived(data)}
                                                    />
                                                </View>
                                                :
                                                <QRCodeScanner
                                                    onRead={this.barcodeReceived.bind(this)}
                                                    style={[Styles.aslCenter, {flex: 1}]}
                                                    cameraStyle={[Styles.aslCenter, {
                                                        height: Dimensions.get('window').height - 340,
                                                        width: Dimensions.get('window').width - 100,
                                                    }]}
                                                    showMarker={false}
                                                    fadeIn={false}
                                                    reactivate={true}
                                                    cameraType={"back"}
                                                    topContent={<Text
                                                        style={[Styles.ffMbold, Styles.colorBlue, Styles.f22, Styles.aslStart]}>Scan
                                                        your Site QR</Text>}
                                                />
                                            :
                                            <View style={{backgroundColor: '#000', flex: 1}}>
                                                <Text>No QR CODE
                                                </Text>
                                            </View>
                                    }
                                </View>
                                <TouchableOpacity style={{marginTop: 20}} onPress={() => {
                                    stateActions({showQRModal: false})
                                }}>
                                    {LoadSVG.cancelIcon}
                                </TouchableOpacity>
                            </View>
                        </Modal>


                        {/*MODAL for Hired Manager Selection*/}
                        <Modal transparent={true}
                               visible={stateCollection.showHiringManagerModal}
                               animated={true}
                               animationType='slide'
                               onRequestClose={() => {
                                   stateActions({showHiringManagerModal: false})
                               }}>
                            <View style={[Styles.modalfrontPosition]}>
                                <View
                                    style={[[Styles.bw1, Styles.aslCenter, Styles.bgWhite, Styles.p15, Styles.br40, Styles.bgWhite, {
                                        width: Dimensions.get('window').width - 80,
                                        height: stateCollection.HiringManagerList.length > 0 ? Dimensions.get('window').height / 1.5 : 200,
                                    }]]}>
                                    <View style={Styles.alignCenter}>
                                        <Text
                                            style={[Styles.ffMbold, Styles.colorBlue, Styles.f22, Styles.m10, Styles.mBtm20]}>Select
                                            Hiring Manager</Text>
                                    </View>
                                    {stateCollection.HiringManagerList.length > 0 ?
                                        <ScrollView style={{height: Dimensions.get('window').height / 2}}>
                                            <List.Section>
                                                {stateCollection.HiringManagerList.map(list => {
                                                    return (
                                                        <List.Item
                                                            onPress={() => {
                                                                stateActions({
                                                                    HiringManagerName: list.fullName,
                                                                    HiringManagerId: list.id,
                                                                    showHiringManagerModal: false,
                                                                })
                                                                this.userdata.hiringManagerId = list.id ? list.id : null
                                                            }}
                                                            style={{marign: 0, padding: 0,}}
                                                            theme={theme}
                                                            titleStyle={[Styles.ffMregular,
                                                                Styles.f14,
                                                                Styles.aslCenter,
                                                                Styles.bw1,
                                                                Platform.OS === 'ios' ? Styles.br0 : Styles.br100,
                                                                {
                                                                    width: 240,
                                                                    textAlign: 'center',
                                                                    paddingHorizontal: 5,
                                                                    paddingVertical: 10,
                                                                    backgroundColor: stateCollection.HiringManagerId === list.id ? '#C91A1F' : '#fff',
                                                                    color: stateCollection.HiringManagerId === list.id ? '#fff' : '#233167',
                                                                    borderWidth: stateCollection.HiringManagerId === list.id ? 0 : 1,
                                                                }]}
                                                            key={list.id}
                                                            title={list.fullName}
                                                        />
                                                    );
                                                })}
                                            </List.Section>
                                        </ScrollView>
                                        :
                                        <View style={[{height: 100}, Styles.mBtm10]}>
                                            <Text style={[Styles.ffMregular, Styles.f16, {textAlign: 'center'}]}>There
                                                are no Hiring Managers for selected site</Text>
                                        </View>
                                    }
                                </View>
                                <TouchableOpacity style={{marginTop: 20}} onPress={() => {
                                    stateActions({showHiringManagerModal: false})
                                }}>
                                    {LoadSVG.cancelIcon}
                                </TouchableOpacity>
                            </View>
                        </Modal>


                        {/*MODAL for user role pop-up*/}
                        <Modal transparent={true} visible={stateCollection.userRolePopup}
                               animated={true}
                               animationType='slide'
                               onRequestClose={() => {
                                   stateActions({userRolePopup: false})
                               }}>
                            <View style={[Styles.modalfrontPosition]}>
                                <View
                                    style={[[Styles.bw1, Styles.aslCenter, Styles.p15, Styles.br40, Styles.bgWhite, {
                                        width: Dimensions.get('window').width - 80,
                                    }]]}>
                                    <View style={[Styles.bgWhite]}>
                                        <View style={Styles.alignCenter}>
                                            <Text
                                                style={[Styles.ffMbold, Styles.colorBlue, Styles.f22, Styles.m10, Styles.mBtm20]}>Select
                                                Role</Text>
                                        </View>
                                        <ScrollView persistentScrollbar={true}>
                                            <List.Section>
                                                {stateCollection.userRoles.map((role, index) => {
                                                    return (
                                                        <List.Item
                                                            onPress={() => {
                                                                stateActions({
                                                                    userRoleName: role.name,
                                                                    userRole: role.key,
                                                                    userRolePopup: false,
                                                                    vehicleType: '',
                                                                    vehicleTypeName: '',
                                                                    vehicleTypeList: role.key === 'DRIVER'
                                                                        ?
                                                                        [{name: '3 Wheeler', value: '3'},
                                                                            {name: '4 Wheeler', value: '4'}]
                                                                        :
                                                                        [{name: '2 Wheeler', value: '2'},
                                                                            {name: '3 Wheeler', value: '3'},
                                                                            {name: '4 Wheeler', value: '4'}]
                                                                })
                                                                this.userdata.userRole = role.key
                                                                // this.getAllCitiesClientsSites()
                                                                this.signupValidation()
                                                            }}
                                                            style={{marign: 0, padding: 0}}
                                                            theme={theme}
                                                            titleStyle={[Styles.ffMregular,
                                                                Styles.colorBlue,
                                                                Styles.f16,
                                                                Styles.aslCenter,
                                                                Styles.bw1,
                                                                Platform.OS === 'ios' ? Styles.br0 : Styles.br100,
                                                                stateCollection.userRole === role.key ? Styles.bgRed : Styles.bgWhite,
                                                                stateCollection.userRole === role.key ? Styles.cWhite : Styles.colorBlue,
                                                                stateCollection.userRole === role.key ? Styles.bw0 : Styles.bw1,
                                                                Styles.padV10, Styles.padH2, Styles.txtAlignCen, {width: 210,}
                                                            ]}
                                                            key={index}
                                                            title={role.name}
                                                        />
                                                    );
                                                })}
                                            </List.Section>
                                        </ScrollView>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => {
                                    stateActions({userRolePopup: false})
                                }} style={{marginTop: 20}}>
                                    {LoadSVG.cancelIcon}
                                </TouchableOpacity>
                            </View>
                        </Modal>

                        {/*MODAL for Vehicle Type*/}
                        <Modal transparent={true} visible={stateCollection.vehicleTypeModal}
                               animated={true}
                               animationType='slide'
                               onRequestClose={() => {
                                   stateActions({vehicleTypeModal: false})
                               }}>
                            <View style={[Styles.modalfrontPosition]}>
                                <View
                                    style={[[Styles.bw1, Styles.aslCenter, Styles.p15, Styles.br40, Styles.bgWhite, {
                                        width: Dimensions.get('window').width - 80,
                                    }]]}>
                                    <View style={[Styles.bgWhite]}>
                                        <View style={Styles.alignCenter}>
                                            <Text
                                                style={[Styles.ffMbold, Styles.colorBlue, Styles.f22, Styles.m10, Styles.mBtm15]}>Select
                                                Vehicle Type</Text>
                                        </View>
                                        <ScrollView persistentScrollbar={true}>
                                            <List.Section>
                                                {
                                                    stateCollection.vehicleTypeList.map((vehicle, index) => {
                                                        return (
                                                            <View key={index}>
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        stateActions({
                                                                            vehicleTypeName: vehicle.name,
                                                                            vehicleType: vehicle.value,
                                                                            vehicleTypeModal: false
                                                                        })
                                                                        this.userdata.vehicleType = vehicle.value
                                                                        this.signupValidation()
                                                                    }}
                                                                    style={[Styles.marV10, Styles.alignCenter]}
                                                                    theme={theme}
                                                                    key={vehicle.value}
                                                                ><Text style={[Styles.ffMregular,
                                                                    Styles.f16,
                                                                    Styles.txtAlignCen,
                                                                    Platform.OS === 'ios' ? Styles.br0 : Styles.br100,
                                                                    Styles.p5,
                                                                    stateCollection.vehicleType === vehicle.value ? Styles.bgRed : Styles.bgWhite,
                                                                    stateCollection.vehicleType === vehicle.value ? Styles.cWhite : Styles.colorBlue,
                                                                    stateCollection.vehicleType === vehicle.value ? Styles.bw0 : Styles.bw1,
                                                                    Styles.padV10, Styles.padH2, Styles.txtAlignCen, {width: 210,}]}><Image
                                                                    style={[Styles.aslCenter, {height: 32, width: 32}]}
                                                                    source={vehicle.value === '2' ? LoadImages.vehicle_two : vehicle.value === '3' ? LoadImages.vehicle_three : vehicle.value === "4" ? LoadImages.vehicle_four : null}
                                                                /> {vehicle.name}</Text></TouchableOpacity>
                                                            </View>
                                                        );
                                                    })
                                                }
                                            </List.Section>
                                        </ScrollView>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => {
                                    stateActions({vehicleTypeModal: false})
                                }} style={{marginTop: 20}}>
                                    {LoadSVG.cancelIcon}
                                </TouchableOpacity>
                            </View>
                        </Modal>

                        {/*MODAL for city pop-up*/}
                        <Modal transparent={true}
                               visible={stateCollection.cityPopup}
                               animated={true}
                               animationType='slide'
                               onRequestClose={() => {
                                   stateActions({cityPopup: false})
                               }}>
                            <View style={[Styles.modalfrontPosition]}>
                                <View
                                    style={[[Styles.bw1, Styles.aslCenter, Styles.bgWhite, Styles.p15, Styles.br40, Styles.bgWhite, {
                                        width: Dimensions.get('window').width - 80,
                                        height: stateCollection.cities.length > 0 ? Dimensions.get('window').height / 1.5 : 200,
                                    }]]}>
                                    <View style={Styles.alignCenter}>
                                        <Text
                                            style={[Styles.ffMbold, Styles.colorBlue, Styles.f22, Styles.m10, Styles.mBtm20]}>Select
                                            City</Text>
                                    </View>

                                    <View style={[Styles.alignCenter, Styles.mBtm10]}>
                                        <Input
                                            style={[Styles.ffMregular,{
                                                height: 50,
                                                width: 250,
                                                borderWidth: 1,
                                                borderRadius: 50,
                                                backgroundColor: '#f5f5f5',
                                                padding: 10,
                                            }]}
                                            placeholder='Search City'
                                            autoCompleteType='off'
                                            placeholderTextColor='#233167'
                                            autoCapitalize="none"
                                            blurOnSubmit={false}
                                            returnKeyType={"done"}
                                            value={stateCollection.searchStrng}
                                            onChangeText={(value) => {
                                                stateActions({searchStrng: value}), this.searchCity(value)
                                            }}
                                        />
                                        <MaterialIcons name='search' color='#000' size={30}
                                                       style={{position: 'absolute', right: 25, top: 12}}/>
                                    </View>
                                    {stateCollection.cities.length > 0 ?
                                        <ScrollView
                                            persistentScrollbar={true}
                                            style={{height: Dimensions.get('window').height / 1.5}}>
                                            <List.Section>
                                                {stateCollection.cities.map((city, index) => {
                                                    return (
                                                        <List.Item
                                                            onPress={() => {
                                                                stateActions({
                                                                    cityName: city.name,
                                                                    cityId: city.id,
                                                                    siteId: '',
                                                                    siteName: '',
                                                                    siteCode: '',
                                                                    siteBussinessUnit: '',
                                                                    cityPopup: false,
                                                                    searchStrng: ''
                                                                })
                                                                this.userdata.cityId = city.id
                                                                this.signupValidation()
                                                                this.getSitesByCity(city.id)
                                                            }}

                                                            style={{marign: 0, padding: 0}}
                                                            theme={theme}
                                                            titleStyle={[Styles.ffMregular,
                                                                Styles.f16,
                                                                Styles.aslCenter,
                                                                Styles.bw1,
                                                                Platform.OS === 'ios' ? Styles.br0 : Styles.br100,
                                                                {
                                                                    width: 210,
                                                                    textAlign: 'center',
                                                                    paddingHorizontal: 5,
                                                                    paddingVertical: 10,
                                                                    backgroundColor: stateCollection.cityId === city.id ? '#C91A1F' : '#fff',
                                                                    color: stateCollection.cityId === city.id ? '#fff' : '#233167',
                                                                    borderWidth: stateCollection.cityId === city.id ? 0 : 1,
                                                                }]}
                                                            key={index}
                                                            title={city.name}
                                                        />
                                                    );
                                                })}
                                            </List.Section>
                                        </ScrollView>
                                        :
                                        <View style={{height: 100}}>
                                            <Text style={[Styles.ffMregular, Styles.f18, {textAlign: 'center'}]}>No
                                                Cities found...</Text>
                                        </View>
                                    }
                                </View>
                                <TouchableOpacity style={{marginTop: 20}}
                                                  onPress={() => {
                                                      stateActions({cityPopup: false, searchStrng: ''})
                                                      this.getAllCitiesClientsSites()
                                                  }}>
                                    {LoadSVG.cancelIcon}
                                </TouchableOpacity>
                            </View>
                        </Modal>

                        {/*MODAL for site pop-up*/}
                        <Modal transparent={true} visible={stateCollection.sitePopup}
                               animated={true}
                               animationType='slide'
                               onRequestClose={() => {
                                   stateActions({sitePopup: false})
                               }}>
                            <View style={[Styles.modalfrontPosition]}>
                                <View
                                    style={[[Styles.bw1, Styles.aslCenter, Styles.bgWhite, Styles.p15, Styles.br40, Styles.bgWhite, {
                                        width: Dimensions.get('window').width - 80,
                                        height: stateCollection.sitesByCity.length > 0 ? Dimensions.get('window').height / 1.5 : 200,
                                    }]]}>
                                    <View style={Styles.alignCenter}>
                                        <Text
                                            style={[Styles.ffMbold, Styles.colorBlue, Styles.f22, Styles.m10, Styles.mBtm20]}>Select
                                            Site</Text>
                                    </View>
                                    {/*persistentScrollbar={true}>*/}
                                    <View style={[Styles.alignCenter, Styles.mBtm10]}>
                                        <Input
                                            style={[Styles.ffMregular,{
                                                height: 50,
                                                width: Dimensions.get('window').width / 1.4,
                                                borderWidth: 1,
                                                borderRadius: 50,
                                                backgroundColor: '#f5f5f5',
                                                padding: 10,
                                            }]}
                                            placeholder='Search Site'
                                            autoCompleteType='off'
                                            placeholderTextColor='#233167'
                                            autoCapitalize="characters"
                                            blurOnSubmit={false}
                                            // returnKeyType="done"
                                            // onSubmitEditing={() => {
                                            //     Keyboard.dismiss();
                                            // }}
                                            value={stateCollection.searchStrng}
                                            onChangeText={(value) => {
                                                stateActions({searchStrng: value}), this.searchSite(value)
                                            }}
                                        />
                                        <MaterialIcons name='search' color='#000' size={30}
                                                       style={{position: 'absolute', right: 30, top: 12}}/>
                                    </View>
                                    {stateCollection.sitesByCity.length > 0 ?
                                        <ScrollView
                                            style={{height: Dimensions.get('window').height / 2}}>
                                            <List.Section>
                                                {stateCollection.sitesByCity.map((site, index) => {
                                                    return (
                                                        <List.Item
                                                            onPress={() => {
                                                                stateActions({
                                                                    siteName: site.name,
                                                                    siteId: site.id,
                                                                    siteCode: site.siteCode,
                                                                    siteBussinessUnit: site.businessUnit,
                                                                    sitePopup: false,
                                                                    searchStrng: '',
                                                                    HiringManagerName: '',
                                                                    HiringManagerId: '',
                                                                    userRoleName: '', userRole: ''
                                                                })
                                                                this.userdata.siteId = site.id
                                                                // Utils.dialogBox('You have selected' + ' ' + site.siteCode + ' ' + '(' + site.name + ')' + ' ' + 'site', '')
                                                                this.signupValidation()
                                                            }}
                                                            style={{marign: 0, padding: 0,}}
                                                            theme={theme}
                                                            titleStyle={[Styles.ffMregular,
                                                                Styles.f14,
                                                                Styles.aslCenter,
                                                                Styles.bw1,
                                                                Platform.OS === 'ios' ? Styles.br0 : Styles.br100,
                                                                {
                                                                    // width: 240,
                                                                    width: Dimensions.get('window').width / 1.5,
                                                                    textAlign: 'center',
                                                                    paddingHorizontal: 5,
                                                                    paddingVertical: 10,
                                                                    backgroundColor: stateCollection.siteId === site.id ? '#C91A1F' : '#fff',
                                                                    color: stateCollection.siteId === site.id ? '#fff' : '#233167',
                                                                    borderWidth: stateCollection.siteId === site.id ? 0 : 1,
                                                                }]}
                                                            key={index}
                                                            title={site.siteCode + ('-' + site.businessUnit) + ' ' + '(' + site.name + ')'}
                                                            // businessUnit
                                                        />
                                                    );
                                                })}
                                            </List.Section>
                                        </ScrollView>
                                        :
                                        <View style={[{height: 100}, Styles.mBtm10]}>
                                            <Text style={[Styles.ffMregular, Styles.f16, {textAlign: 'center'}]}>There
                                                are no sites associated with your search</Text>
                                        </View>
                                    }
                                </View>
                                <TouchableOpacity style={{marginTop: 20}} onPress={() => {
                                    stateActions({sitePopup: false, searchStrng: ''}),
                                        this.getAllCitiesClientsSites();
                                    this.getSitesByCity(stateCollection.cityId);

                                }}>
                                    {LoadSVG.cancelIcon}
                                </TouchableOpacity>
                            </View>
                        </Modal>


                        <View style={[Styles.mBtm10]}>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                // onPress={() => this.onSignUp('onClickSave')}
                                onPress={() => this.signupValidation('onClickSave')}
                                style={[Styles.mTop20, {backgroundColor: '#C91A1F'}, Styles.bcRed, Styles.br5,]}>
                                <Text
                                    style={[Styles.f18, Styles.ffMbold, Styles.cWhite, Styles.padH10, Styles.padV10, Styles.aslCenter]}>REGISTER</Text>
                            </TouchableOpacity>

                            <View style={[Styles.row, Styles.jCenter, Styles.mTop15]}>
                                <Text style={[Styles.colorLblue, Styles.ffMbold, Styles.f16]}>
                                    Already have an account?
                                </Text>
                                <TouchableOpacity onPress={() => this.props.navigation.navigate('Login')}>
                                    <Text style={[Styles.colorGreen, Styles.ffMbold, Styles.f16]}> Sign in </Text>
                                </TouchableOpacity>
                                <Text style={[Styles.colorLblue, Styles.ffMbold, Styles.f16]}>now.</Text>
                            </View>
                        </View>
                    </KeyboardAvoidingView>

                </ScrollView>

            </View>

        );
    }

}

function mapStateToProps(state) {
    return {
        SignupState: state.SignUp,
    }
}

function mapDispatchToProps(dispatch) {
    return {
        getActionSignUp: bindActionCreators(ActionSignUp, dispatch),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(SignupScreen)

