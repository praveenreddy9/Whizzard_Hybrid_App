import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    KeyboardAvoidingView, Keyboard
} from 'react-native';
import {CSpinner, Styles} from '.././common';
import Icon from 'react-native-vector-icons/dist/Ionicons';
import Utils from ".././common/Utils";
import Config from ".././common/Config";
import Services from '.././common/Services';
import OfflineNotice from '.././common/OfflineNotice';
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import {TextInput, Button, DefaultTheme, Surface, Appbar} from "react-native-paper";
import LoginScreen from "../LoginScreen";
import _ from "lodash";


const width = Dimensions.get('window').width;

const theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        text: '#233167',
        primary: '#233167', underlineColor: 'transparent'
    }
};

class ResetPassword extends React.Component {

    constructor(props) {
        super(props);
        this.keyboardWillShow = this.keyboardWillShow.bind(this)
        this.keyboardWillHide = this.keyboardWillHide.bind(this)
    }
    state = {
        spinnerBool: false,
        phoneNumber: '',
        code: '',
        password: '',
        confirmPassword: '', KeyboardVisible: true,
        rememberMe: true,
        token: '',
        ErrorMessage: '',
        isValidMobileNumber: null,
        isValidPassword: null,
        errorPassMessage: null,
        isValidCPassword: null,
        errorCPassMessage: null,
        errorMobileMessage: null,
        showLogin: false
    };

    componentDidMount() {
        this.keyboardWillShowSub = Keyboard.addListener('keyboardDidShow', this.keyboardWillShow);
        this.keyboardWillHideSub = Keyboard.addListener('keyboardDidHide', this.keyboardWillHide);
        const self = this;
        self.setState({
            phoneNumber: self.props.navigation.state.params.phoneNumber,
            code: self.props.navigation.state.params.code
        });
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
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    errorHandling(error) {
        const self = this;
        if (error.response) {
            if (error.response.status === 403) {
                self.setState({spinnerBool: false});
                Utils.dialogBox("Token Expired,Please Login Again", '');
                self.props.navigation.navigate('Login');
            }else {
                self.setState({spinnerBool: false});
                {
                    Services.returnErrorResponseDataMessage(error);
                }
            }
        } else {
            self.setState({spinnerBool: false});
            Utils.dialogBox(error.message, '');
        }
    }

    //reset password is during OTP enter
    resetPassword() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.RESET_PASSWORD;
        const body = JSON.stringify({
            code: this.state.code,
            password: this.state.password,
            phoneNumber: this.state.phoneNumber
        });
        // console.log('resetPassword apiUrl', apiUrl);
        // console.log('resetPassword body', body);
        this.setState({spinnerBool: true}, () => {
            Services.NoAuthHTTPRequestinData(apiUrl, 'PUT', body, function (response) {
                if (response.status === 200) {
                    // console.log("resetPassword response", response);
                    self.setState({spinnerBool: false});
                    Utils.dialogBox('Your password has been Changed!', '');
                    self.props.navigation.navigate('Login');
                }
            }, function (error) {
                // console.log("resetPassword error", error.response,error);
                self.errorHandling(error)
            });
        });

    }

    //update password is during first login
    updatePassword() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL +  Config.routes.UPDATE_PASSWORD;
        const body = JSON.stringify({
                    newPassword: this.state.password,
                    userId: this.state.phoneNumber
                }) ;
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    self.setState({spinnerBool: false});
                    Utils.dialogBox('Your password has been Changed!', '');
                    self.props.navigation.navigate('Login');
                }
            }, function (error) {
                // console.log("updatePassword error", error.response,error);
                self.errorHandling(error)
            });
        });

    }


    validatePassword = () => {
        let resp = {};
        let result = {};
        resp = Utils.isValidPassword(this.state.password);
        if (resp.status === true) {
            result.password = resp.message;
            this.setState({isValidPassword: true, errorPassMessage: ''});
            resp = Utils.isValidCPassword(this.state.password, this.state.confirmPassword);
            if (resp.status === true) {
                result.password = resp.message;
                this.setState({isValidCPassword: true, errorCPassMessage: '', showLogin: true});
            } else {
                this.setState({isValidCPassword: false, errorCPassMessage: resp.message, showLogin: false});
            }
        } else {
            this.setState({isValidPassword: false, errorPassMessage: resp.message, showLogin: false});
        }
    }

    render() {
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                <OfflineNotice/>
                {this.renderSpinner()}
                <Appbar.Header style={[Styles.bgWhite]}>
                    <Appbar.Action icon="chevron-left" size={50}
                                   onPress={() => this.props.navigation.goBack()}/>
                </Appbar.Header>
                <ScrollView style={[Styles.marH20]}>
                <View style={[Styles.marV20]}>
                    <Text style={[Styles.colorBlue, Styles.f28, Styles.ffMregular]}>
                        Please enter,
                    </Text>
                    <Text style={[Styles.colorBlue, Styles.f25, Styles.ffMbold]}>
                        a new password
                    </Text>
                    <Text style={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.marV10]}>The recovery code was
                        sent to your,{"\n"}mobile number please enter the code</Text>
                </View>


                    <KeyboardAvoidingView style={{flex: 1}}>

                        <View>
                            <TextInput label='New Password*'
                                       theme={theme}
                                       mode='outlined'
                                       autoCompleteType='off'
                                       placeholderTextColor='#233167'
                                       autoCapitalize="none"
                                       blurOnSubmit={false}
                                       returnKeyType="next"
                                       placeholder='New Password'
                                       secureTextEntry={true}
                                       value={this.state.password}
                                       ref={(input) => {
                                           this.password = input;
                                       }}
                                       onSubmitEditing={() => {
                                           this.confirmPassword.focus();
                                       }}
                                       onChangeText={(password) => this.setState({password}, function () {
                                           this.validatePassword()
                                       })}/>
                            {
                                this.state.errorPassMessage ?
                                    <Text style={[Styles.cRed,Styles.ffMregular,Styles.pLeft20,Styles.mBtm10]}>{this.state.errorPassMessage}</Text>
                                    :
                                    <Text/>
                            }
                            {this.state.isValidPassword === true ?
                                Services.successIcon()
                                :
                                this.state.isValidPassword === false ?
                                    Services.errorIcon() : null
                            }
                        </View>
                        <View>
                            <TextInput label='Confirm Password*'
                                       theme={theme}
                                       mode='outlined'
                                       autoCompleteType='off'
                                       placeholderTextColor='#233167'
                                       autoCapitalize="none"
                                       blurOnSubmit={false}
                                       returnKeyType="done"
                                       placeholder='Confirm Password'
                                       secureTextEntry={true}
                                       value={this.state.confirmPassword}
                                       ref={(input) => {
                                           this.confirmPassword = input;
                                       }}
                                       onSubmitEditing={() => {this.state.code==='FirstLogin'?this.updatePassword(): this.resetPassword()}}
                                       onChangeText={(confirmPassword) => this.setState({confirmPassword}, function () {
                                           this.validatePassword();
                                       })}/>
                            {
                                this.state.errorCPassMessage ?
                                    <Text style={[Styles.cRed,Styles.ffMregular,Styles.pLeft20,Styles.mBtm10]}>{this.state.errorCPassMessage}</Text>
                                    :
                                    <Text/>
                            }
                            {this.state.isValidCPassword === true ?
                                Services.successIcon()
                                :
                                this.state.isValidCPassword === false ?
                                    Services.errorIcon() : null
                            }
                        </View>

                    </KeyboardAvoidingView>


                    <TouchableOpacity
                        onPress={() =>this.state.code==='FirstLogin'?this.updatePassword(): this.resetPassword()}
                        disabled={this.state.showLogin === false}
                        style={[Styles.mTop40,Styles.mBtm10, {backgroundColor: this.state.showLogin === false ? '#cccccc' : '#C91A1F'}, Styles.bcRed, Styles.br5,]}>
                        <Text
                            style={[Styles.f18, Styles.ffMbold, Styles.cWhite, Styles.padH10, Styles.padV10, Styles.aslCenter]}>Change
                            Password</Text>
                    </TouchableOpacity>

                </ScrollView>
            </View>

        );
    }
}

export default ResetPassword;
