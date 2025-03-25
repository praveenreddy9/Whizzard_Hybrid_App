import React, {Component} from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    BackHandler,
    TouchableOpacity,
    Linking,
    ImageBackground, Dimensions, TextInput, Modal, ActivityIndicator, PermissionsAndroid, Alert, Platform
} from "react-native";
import {Appbar, Card, Divider, Title} from 'react-native-paper';
import {CSpinner, LoadImages, LoadSVG, Styles} from "../common";
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import FastImage from "react-native-fast-image";
import VehicleDetailsScreen from "./VehicleDetailsScreen";
import Config from "../common/Config";
import Services from "../common/Services";
import Utils from "../common/Utils";
import OfflineNotice from "../common/OfflineNotice";
import _ from "lodash";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Picker} from '@react-native-picker/picker';
// import PDFView from "react-native-view-pdf";
// import RNFetchBlob from "rn-fetch-blob";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import ImageZoom from "react-native-image-pan-zoom";
import MonthSelectorCalendar from "react-native-month-selector";
import DeviceInfo from "react-native-device-info";
// import RNHTMLtoPDF from "react-native-html-to-pdf";
// import RNFS from "react-native-fs";


const options = {
    title: 'Select Avatar',
    // customButtons: [{name: 'fb', title: 'Choose Photo from Facebook'}],
    allowsEditing: false,
    storageOptions: {
        skipBackup: true,
        path: 'images',
    },
    cropping:true,
    maxWidth: 1200, maxHeight: 800,
};

// let contractPDFurl = 'https://mybus-prod-uploads.s3.amazonaws.com/ContractServices/63872033ceba2cfc60584cad_Praveen_Vangala_WZ-11986_Contract_Service_Agreement_Supply_RollOut.pdf?response-content-disposition=attachment%3B%20filename%3DContractServices%2F63872033ceba2cfc60584cad_Praveen_Vangala_WZ-11986_Contract_Service_Agreement_Supply_RollOut.pdf&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20230327T085822Z&X-Amz-SignedHeaders=host&X-Amz-Expires=900&X-Amz-Credential=AKIATZBSQTA3TJFLABO5%2F20230327%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=5615af1c6958239021c332bb8330d860d232c39ec120a78383167761bf206aa6'
// let contractPDFurl = 'https://www.africau.edu/images/default/sample.pdf'
let contractPDFurl = 'https://zip-code-clustering.s3.amazonaws.com/%234545759.pdf'

export default class NewProfileScreen extends Component {


    constructor(props) {
        super(props);
        this.didFocus = props.navigation.addListener('didFocus', payload =>
            BackHandler.addEventListener('hardwareBackPress', this.onBack),
        );
        this.state = {
            spinnerBool: false,
            UserID: '',
            pendingFields: [],
            selectedProfileUserID: '',
            onFocusPendingItem: '',
            editProfileDetailsModal: false,
            bloodGroups: [{name: 'Select Blood Group', value: ''},
                {name: 'A+', value: 'A+'}, {name: 'A-', value: 'A-'},
                {name: 'B+', value: 'B+'}, {name: 'B-', value: 'B-'},
                {name: 'AB+', value: 'AB+'}, {name: 'AB-', value: 'AB-'},
                {name: 'O+', value: 'O+'}, {name: 'O-', value: 'O-'}],
            contactPersonName:'',contactPersonNumber:'',
            emergencyContactNumber:'',
            bloodGroup:'',
            // clientEmployeeId:'',
            canUpdateData:true,
            insuranceCardModal:false,idCardDetailsModal:false,idCardInfo:[],contractDetailsModal:false,contractInfo:[],
            imagePreview: false, imagePreviewURL: '',imageRotate:'0',
            imageSelectionModal:false,
            monthFilterModal:false,payslipPreview:false,
            phoneNumber: '', dateFilterModal: false,paySlipSelectedDate:Services.returnCalendarMonthYearNumber(new Date()),paySlipData:'',
            holidaysDisplayModal:false,holidaysList:[],
        }
    }

    onBack = () => {
        if (this.state.UserFlow === 'SITE_ADMIN') {
            if (this.state.UserStatus === "ACTIVE" || this.state.UserStatus === "ACTIVATED") {
                if (this.state.selectedUserSiteDetails.toScreen === 'userShiftActions') {
                    return this.props.navigation.navigate('userShiftActions');
                } else {
                    return this.props.navigation.navigate('Pipeline');
                }
            } else {
                return this.props.navigation.navigate('PendingUsersScreen');
            }
        } else {
            if (this.state.UserStatus === "ACTIVE" || this.state.UserStatus === "ACTIVATED") {
                return this.props.navigation.navigate('HomeScreen');
            } else {
                return this.props.navigation.navigate('ProfileStatusScreen');
            }
        }
    };

    componentWillUnmount() {
        this.didFocus.remove();
        this.willBlur.remove();
        BackHandler.removeEventListener('hardwareBackPress', this.onBack);
        Services.checkMockLocationPermission((response) => {
            if (response){
                this.props.navigation.navigate('Login')
            }
        })
    }


    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    componentDidMount() {
        this.willBlur = this.props.navigation.addListener('willBlur', payload =>
            BackHandler.removeEventListener('hardwareBackPress', this.onBack)
        );
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            AsyncStorage.getItem('Whizzard:selectedUserSiteDetails').then((selectedUserSiteDetails) => {
            AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
                const parsedSiteDetails = JSON.parse(selectedUserSiteDetails)
                self.setState({
                    UserFlow: self.props.navigation.state.params.UserFlow,
                    UserStatus: self.props.navigation.state.params.UserStatus,
                    UserID: self.props.navigation.state.params.selectedProfileUserID,
                    selectedUserSiteDetails: parsedSiteDetails,
                    userRole
                }, () => {
                    self.getProfileDetails();
                });
            });
            });
        });
    };

    errorHandling(error) {
        // console.log("profile screen error", error, error.response);
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

    // //Storage Permissions to Download Image
    // async requestDownloadPermissions() {
    //     if (Platform.OS === 'ios') {
    //         await this.downloadImage();
    //     } else {
    //         try {
    //             const granted = await PermissionsAndroid.request(
    //                 PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    //                 {
    //                     title: 'Storage Permission Required',
    //                     message:
    //                         'Whizzard needs access to your storage to download Photos',
    //                 }
    //             );
    //             if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    //                 // console.log('Storage Permission Granted.');
    //                 this.downloadImage();
    //             } else {
    //                 alert('Storage Permission Not Granted');
    //             }
    //         } catch (err) {
    //             console.warn(err);
    //         }
    //     }
    // }

    // //will add an extension for path (now not using)
    // getExtention = filename => {
    //     // To get the file extension
    //     // console.log('extension filename',filename);
    //     return /[.]/.exec(filename) ?
    //         /[^.]+$/.exec(filename) : undefined;
    // };
    // //to download image (using blob)
    // downloadImage = async () => {
    //     let date = new Date();
    //     let image_URL = this.state.idCardInfo;
    //
    //     const idInfo = [
    //         {file: this.state.idCardInfo.idCardFrontCopyUrl,title:'Whizzard Front side card'},
    //         {file: this.state.idCardInfo.idCardBackCopyUrl,title:'Whizzard Back side card'}
    //     ]
    //     // idInfo.push()
    //     // idInfo[0].file = this.state.idCardInfo.idCardFrontCopyUrl
    //     // idInfo[1].file = this.state.idCardInfo.idCardBackCopyUrl
    //
    //
    //     // console.log('id total idInfo',idInfo);
    //
    //
    //     idInfo.map((item) => {
    //         // console.log('id inside item',item);
    //         // let ext = this.getExtention(image_URL);
    //         // ext = '.' + ext[0];
    //
    //         const {config, fs} = RNFetchBlob;
    //         let PictureDir = fs.dirs.PictureDir;
    //         // const extention = item.media.split(".").pop(); // get item extention
    //         let options = {
    //             fileCache: true,
    //             addAndroidDownloads: {
    //                 useDownloadManager: true,
    //                 // appendExt: extention,
    //                 notification: true,
    //                 // path:  PictureDir +  '/image_' +  Math.floor(date.getTime() + date.getSeconds() / 2) + ext,
    //                 path:  PictureDir +  '/image_' +  Math.floor(date.getTime() + date.getSeconds() / 2) + '.png',
    //                 // path:  PictureDir +  '/image_' +  Math.floor(date.getTime() + date.getSeconds() / 2) + '.pdf',
    //                 // title: 'Whizzard Id Card',
    //                 title: item.title,
    //                 mime: 'image/png',
    //                 description: 'Downloading Image',
    //             },
    //         };
    //         config(options)
    //             // .fetch('GET', image_URL)
    //             .fetch('GET', item.file)
    //             .then(res => {
    //                 // let status = res.info().status;
    //                 // console.log('download resp ==> ', JSON.stringify(res));
    //                 // alert('Image Downloaded Successfully.');
    //                 Utils.dialogBox('Downloaded Succesfully','')
    //             }).catch((errorMessage, statusCode) => {
    //             console.log('download error -> ', errorMessage, 'statusCode==>', statusCode);
    //         });
    //     })
    // };

    //API CALL TO FETCH PROFILE DETAILS
    getProfileDetails() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_USER_PROFILE_DETAILS + '?&userId=' + self.state.UserID;
        const body = '';
        this.setState({spinnerBool: true, pendingFields: []}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response) {
                    var data = response.data;
                    // console.log('profile resp 200', response.data);
                    Utils.setToken('userStatus', data.userStatus, function () {
                    });
                        AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
                            data.userStatus === 'ACTIVATED'
                                ?
                                self.state.UserFlow === 'NORMAL'
                                    ?
                                    self.setState({canEditTextInput: userRole === '45'})
                                    :
                                    self.setState({canEditTextInput: self.state.UserFlow === 'SITE_ADMIN' && userRole === '45'})
                                :
                                self.setState({canEditTextInput: true})
                        });


                    if (self.state.canUpdateData) {
                        self.setState({
                            spinnerBool: false,
                            MyProfileResp: data,
                            checkProfileField: data,
                            contactPersonNumber: data.contactNumber,
                            contactPersonName: data.contactPersonName,
                            emergencyContactNumber: data.emergencyContactNumber,
                            bloodGroup: data.bloodGroup,
                            pendingFields: data.errors ? data.errors : [],
                        });
                    }else {
                        self.setState({
                            MyProfileResp: data,
                            UserID: data.userId,
                            pendingFields: data.errors ? data.errors : [],
                            spinnerBool: false,
                        });
                    }
                    const onFocusPendingItem = self.props.navigation.state.params.onFocusPendingItem;
                    if (onFocusPendingItem && self.state.canUpdateData === true && data.profilePicDetails === null){
                        self.checkPendingItem(onFocusPendingItem);
                    }

                }
            }, function (error) {
                // console.log(' getProfileDetails error', error, error.response);
                self.errorHandling(error)
            });
        });
    }

    checkPendingItem(onFocusPendingItem) {
        if(onFocusPendingItem === "Missing Profile pic" || onFocusPendingItem === "Missing Employee Id" || onFocusPendingItem === "User Number and Emergency Contact Number are same"){
            this.setState({editProfileDetailsModal:true})
        }
    }

    ValidateEmergencyDetails(button) {
        let resp = {};
        let result = {};
        resp = Utils.isValidEmergencyPersonName(this.state.contactPersonName);
        if (resp.status === true) {
            result.contactPersonName = resp.message;
            resp = Utils.isValidMobileNumber(this.state.emergencyContactNumber);
            if (resp.status === true) {
                result.emergencyContactNumber = resp.message;
                resp = Utils.isValueSelected(this.state.bloodGroup,'Please Select Blood Group');
                if (resp.status === true) {
                    result.bloodGroup = resp.message;
                    if (button === 'onClickSave'){
                        this.updateEmergencyContactInfo()
                    }
                } else {
                    Utils.dialogBox(resp.message, '')
                }
            } else {
                Utils.dialogBox(resp.message, '');
            }
        } else {
            Utils.dialogBox(resp.message,'');
        }
    }

    updateEmergencyContactInfo() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.UPDATE_EMERGENCY_INFORMATION_WEB + '?&userId=' + self.state.UserID;
        const body = {
            contactPersonName: self.state.contactPersonName,
            emergencyContactNumber: self.state.emergencyContactNumber,
            bloodGroup: self.state.bloodGroup,
        };
        // console.log('updateEmergencyContactInfo URL', apiUrl, body);
        this.setState({spinnerBool: true, pendingFields: []}, () => {
            Services.AuthHTTPRequestForShiftFlow(apiUrl, 'PUT', body, function (response) {
                if (response) {
                    var data = response.data;
                    Utils.dialogBox('Profile Updated Successfully !', '')
                    self.setState({
                        spinnerBool: false,
                        editProfileDetailsModal:false
                    }, function () {
                        self.getProfileDetails()
                    });
                }
            }, function (error) {
                // console.log(' updateEmergencyContactInfo error', error.response);
                self.errorHandling(error)
            });
        });
    }

    getUserInsuranceCard() {
        const self = this;
        // const apiUrl = Config.routes.BASE_URL + Config.routes.GET_USER_INSURANCE_CARD + '?userId='+self.state.UserID;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_USER_INSURANCE_CARD + '?userId='+self.state.MyProfileResp.userId;;
        const body = {};
        // console.log('insurance apiUrl',apiUrl);
        this.setState({spinnerBool: true, pendingFields: []}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response) {
                    var data = response.data;
                    // console.log('dataaaa insuracne', data);
                    if(data.status.status === 'true') {
                        let initialData = data.status.memberData;
                        let insuranceCard =''
                        if (initialData[631]){
                            insuranceCard  = initialData[631].self.eacrd;
                        }else if (initialData[632]){
                            insuranceCard  = initialData[632].self.eacrd;
                        }else if (initialData[633]){
                            insuranceCard  = initialData[633].self.eacrd;
                        }else if (initialData[634]){
                            insuranceCard  = initialData[634].self.eacrd;
                        }
                        if (insuranceCard === ''){
                            Utils.dialogBox('Error fetching Insurance Details', '')
                        }else {
                            self.setState({insuranceCardModal:true, insuranceCard:insuranceCard})
                        }
                    }else{
                        Utils.dialogBox('Insurance Details not found', '')
                    }
                    self.setState({    spinnerBool: false  });
                }
            }, function (error) {
                // console.log(' insurance error', error.response, error);
                self.errorHandling(error)
            });
        });
    }

    getUserIdCardInfo() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_USER_ID_CARD + '?userId='+self.state.MyProfileResp.userId;
        const body = {};
        // console.log('ID card apiUrl',apiUrl);
        this.setState({spinnerBool: true, pendingFields: []}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    var data = response.data;
                    // console.log('getUserIdCardInfo resp200', data);
                    self.setState({   spinnerBool: false,idCardInfo :data,idCardDetailsModal:true  });
                }
            }, function (error) {
                // console.log(' getUserIdCardInfo error', error.response, error);
                self.errorHandling(error)
            });
        });
    }
    getUserContractInfo() {
        const self = this;
        // const apiUrl = Config.routes.BASE_URL + Config.routes.GET_USER_CONTRACT_DETAILS + self.state.UserID;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_USER_CONTRACT_DETAILS + self.state.MyProfileResp.userId;
        const body = {};
        // console.log('ID card apiUrl',apiUrl);
        this.setState({spinnerBool: true, pendingFields: []}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    var data = response.data;
                    // console.log('getUserContractInfo resp200', data.contractUrl);
                    if (data.contractFound){
                        self.setState({spinnerBool: false,
                            contractInfo :data.contractUrl,
                            contractDetailsModal:data.contractFound,contractFound:data.contractFound  });
                    }else {
                        Utils.dialogBox('Contract Details not found', '');
                        self.setState({   spinnerBool: false});
                    }
                }
            }, function (error) {
                // console.log(' getUserContractInfo error', error.response, error);
                self.errorHandling(error)
            });
        });
    }





    updateProfilePic = (uploadType) => {
        const self = this;
        // Services.checkImageUploadPermissions('LIBRARY',(response)=>{
        //     Services.checkImageUploadPermissions('CAMERA', (response) => {
            Services.checkImageUploadPermissions(uploadType, (response) => {
            // console.log('service image retunr', response);
            let imageData = response.image
            let imageFormData = response.formData
            let userImageUrl = imageData.path

            let profilePicUploadURL = Config.routes.BASE_URL + Config.routes.UPLOAD_PROFILE_PIC + '?&userId=' + self.state.UserID;
             const body = imageFormData;
            this.setState({spinnerBool: true}, () => {
                Services.AuthProfileHTTPRequest(profilePicUploadURL, 'POST', body, function (response) {
                    // console.log("profilePicUpload resp", response);
                    if (response) {
                        self.getProfileDetails();
                        self.setState({spinnerBool: false, UserID: self.state.UserID}, () => {
                            Utils.dialogBox("Uploaded successfully", '', function () {
                            })
                        })
                        if(self.state.UserFlow === 'NORMAL' ){
                            // console.log('entered for pic into local')
                            if (response.data.profilePicUploadUrl){
                                Utils.setToken('profilePicUrl', response.data.profilePicUploadUrl, function () {
                                });
                            }else {
                                console.log('into else of profile pic')
                            }
                        }
                    }
                }, function (error) {
                    console.log(' upload pic error', error.response);
                    self.errorHandling(error)
                });
            });

        })
    };

    rotate(){
        let newRotation = JSON.parse(this.state.imageRotate) + 90;
        if(newRotation >= 360){
            newRotation =- 360;
        }
        this.setState({
            imageRotate: JSON.stringify(newRotation),
        })
    }

    getStaffPayslip() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.FETCH_STAFF_PAYSLIP_DATA+ self.state.paySlipSelectedDateforAPI + '/'+self.state.MyProfileResp.userId;
        // const apiURL = Config.routes.BASE_URL + Config.routes.FETCH_STAFF_PAYSLIP_DATA+ self.state.paySlipSelectedDateforAPI + '/5fd8d644ceba2c198e72a3af'
        const body = {}
        // console.log('payslip====',apiURL,body);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, 'GET', body, function (response) {
                if (response) {
                    // console.log('staff payslip resp',response.data);
                    // let neededSlip = response.data[1] ? response.data[1] : [];
                    let neededSlip = response.data;
                    self.setState({
                        spinnerBool: false,
                        payslipResponse: neededSlip,
                        setPdfName:neededSlip ? neededSlip.name : '',
                    }, () => {
                        // self.createPDF()
                        neededSlip.showPayslipForMobile ?  self.checkStoragePermissions() : Utils.dialogBox("Payslip cannot be accessed for selected month", '');
                    })
                }
            }, function (error) {
                self.errorHandling(error)
            });
        });
    };

    getFleetPayslip() {
        const self = this;
        // const apiURL = Config.routes.BASE_URL + Config.routes.FETCH_FLEET_PAYSLIP_DATA;
        const apiURL = Config.routes.BASE_URL + Config.routes.FETCH_FLEET_PAYSLIP_DATA+ self.state.paySlipSelectedDateforAPI + '/'+self.state.MyProfileResp.userId;
        const body = {}
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, 'GET', body, function (response) {
                if (response) {
                    // console.log('paylsips resp', response.data)
                    const tempData = response.data;
                    const respData = response.data.deductionsTypes;
                    let otherDeductions = [];
                    let lossDeductions = [];
                    for (let i=0;i<respData.length;i++){
                        if (respData[i].category === 'Penalty - Attendance' || respData[i].category === 'Deductions - Trip Penalty'
                            || respData[i].category === 'Deductions - Expenditure' || respData[i].category === 'Penalty - ShortCash'
                            || respData[i].category === 'Negative Balance' || respData[i].category === 'Other/ExpenditureLoss'){
                            otherDeductions.push(respData[i])
                        }else if (respData[i].category === 'Total Short Cash' || respData[i].category === 'Deductions - Vehicle EMI'
                            || respData[i].category === 'Deductions - Shipment Loss' || respData[i].category === 'Deductions - BGV') {
                            lossDeductions.push(respData[i])
                        }
                    }
                    otherDeductions.push({label: 'processingFee', category: 'Processing Fee (' + tempData.processingFeePercentage + '%' + ')', amount: tempData.processingFee})
                    self.setState({
                        spinnerBool: false,
                        payslipResponse: tempData,otherDeductions,lossDeductions,
                        setPdfName:tempData.fullName
                    }, () => {
                        tempData.showPayslipForMobile ?
                            self.checkStoragePermissions() : Utils.dialogBox("Payslip cannot be accessed for selected month", '');
                    })
                }
            }, function (error) {
                self.errorHandling(error)
            });
        });
    };

    // async checkStoragePermissions(){
    //     let apiLevel = '';
    //     if (Platform.OS === 'android') {
    //         DeviceInfo.getApiLevel().then(async (apiLevel) => {
    //             // console.log('============api',apiLevel,typeof(apiLevel))
    //             if (apiLevel < 33) {
    //                 // console.log('into ifff=====')
    //                 const permissionGranted = await this.requestDownloadPermissionsForPayslip();
    //                 if (permissionGranted) {
    //                     this.createPDF(apiLevel)
    //                 }
    //             } else {
    //                 // console.log('into else========')
    //                 // const permissionGrantedforAndroid13 = await this.requestDownloadPermissionsforAndroid13();
    //                 // if (permissionGrantedforAndroid13) {
    //                 //     this.createPDF()
    //                 // }
    //                 this.createPDF(apiLevel)
    //             }
    //         }).catch((err)=>{
    //             this.createPDF(apiLevel)
    //         });
    //     }else {
    //         this.createPDF(apiLevel)
    //     }
    // }



//     returnHTMLfields() {
//         const {payslipResponse,otherDeductions,lossDeductions} = this.state
//
//         //td-column
//         //th-head
//         //tr-row
//
//         let siteFinalPayoutSecondPdfData = payslipResponse
//         // let monthView = 'JAN-2023'
//         let monthView = Services.returnCalendarMonthYear(this.state.paySlipSelectedTimeStamp)
//         let ruppeHtmlCode = '&#8377;'
//         let whizzard_logo = "../../assets/images/activeDriver.png"
//         let whizzard_http_logo = "http://static1.squarespace.com/static/5ea6d7933221c020e425a06e/5ea9ca54b36fb312e4f183fc/5ffaa8426aadcc43031133da/1610262915144/Whizzard.png?format=1500w"
//         const tempReturnHTMLfields = `
//        <html lang="en" >
// <head>
//   <meta charset="UTF-8">
//   <title>Simpliance Audit</title>
// </head>
// <body style="background-color: #fff">
// <table class="table-border-none"
//        style="border: none; border-collapse: collapse; font-family: Arial, sans-serif; width: 100%" border="1">
//   <thead style="width: 100%">
//   <tr>
//     <td colspan="3" style="font-size: 25px;font-weight: 600;padding: 4px 6px;">ZIP ZAP Logistics Private Limited</td>
//     <td colspan="3" >
//     <img src=${whizzard_http_logo}
//          style="height: 90px; width: 150px;"/>
// </td>
//   </tr>
//   <tr>
//     <td colspan="3" style="padding: 4px 6px">Payment Advice for the month of ${monthView}</td>
//   </tr>
//   </thead>
//   <tbody>
//   <tr>
//     <th colspan="4" style="border: 1px solid #ddd !important;padding: 0;"></th>
//   </tr>
//   <tr>
//   <tr>
//     <th colspan="4" style="background-color: black; color: white; height: 25px; padding: 4px 6px;">Details</th>
//   </tr>
//   <tr>
//     <td style="padding: 4px 6px">Employee Name</td>
//     <td style="text-align: left; padding: 4px 6px">${siteFinalPayoutSecondPdfData.fullName || '---'}</td>
//     <td style="padding: 4px 6px">Mobile Number</td>
//     <td style="text-align: left; padding: 4px 6px">${siteFinalPayoutSecondPdfData.phoneNumber || '---'}</td>
//   </tr>
//   <tr>
//     <td style="padding: 4px 6px;">Role</td>
//     <td
//       style="text-align: left; padding: 4px 6px;">${Services.getUserRoles(siteFinalPayoutSecondPdfData.role) || '---'}</td>
//     <td style="padding: 4px 6px;">Status</td>
//     <td style="text-align: left; padding: 4px 6px;">${siteFinalPayoutSecondPdfData.userStatus || '---'}</td>
//   </tr>
//   <tr>
//     <td style="padding: 4px 6px;">Station Code</td>
//     <td style="text-align: left; padding: 4px 6px">${siteFinalPayoutSecondPdfData.locationCode || '---'}</td>
//     <td style="padding: 4px 6px;">City</td>
//     <td style="text-align: left; padding: 4px 6px;">${siteFinalPayoutSecondPdfData.location || '---'}</td>
//   </tr>
//   <tr>
//     <td style="padding: 4px 6px;">Vehicle Type</td>
//     <td style="text-align: left; padding: 4px 6px;">${siteFinalPayoutSecondPdfData.vehicleType || '---'} -Wheeler</td>
//     <td style="padding: 4px 6px;">Activation Date</td>
// <!--    <td style="text-align: left; padding: 4px 6px;">${siteFinalPayoutSecondPdfData.activatedDate || '--'}</td>-->
//     <td style="text-align: left; padding: 4px 6px;">${Services.returnDateMonthYearFormatinMonthShortForPayslip(siteFinalPayoutSecondPdfData.activatedDate) || '--'}</td>
//   </tr>
//
//   <tr>
//     <td style="padding: 4px 6px;">Beneficiary Name</td>
//     <td style="text-align: left; padding: 4px 6px">${siteFinalPayoutSecondPdfData.beneficiaryName || '---'}</td>
//
//     <td style="padding: 4px 6px;">Account Number</td>
//     <td style="text-align: left; padding: 4px 6px">${siteFinalPayoutSecondPdfData.accountNumber || '---'}</td>
//   </tr>
//   <tr>
//     <td style="padding: 4px 6px">IFSC Code</td>
//     <td style="text-align: left; padding: 4px 6px;">${siteFinalPayoutSecondPdfData.ifscCode || '---'}</td>
//     <td style="padding: 4px 6px">PAN</td>
//     <td style="text-align: left; padding: 4px 6px;">${siteFinalPayoutSecondPdfData.panNumber || '---'}</td>
//   </tr>
//   <tr>
//     <td style="padding: 4px 6px">WZ User ID</td>
//     <td style="text-align: left; padding: 4px 6px;">${siteFinalPayoutSecondPdfData.userId || '---'}</td>
//     <td style="padding: 4px 6px">Client Login ID</td>
//     <td style="text-align: left; padding: 4px 6px;">${siteFinalPayoutSecondPdfData.amazonLoginId || 'NA'}</td>
//   </tr>
//   <tr>
//     <td style="padding: 4px 6px">Client Employee ID</td>
//     <td style="text-align: left; padding: 4px 6px;">${siteFinalPayoutSecondPdfData.empCode || 'NA'}</td>
//     <td style="padding: 4px 6px">No. of Standard Days</td>
//     <td style="text-align: left; padding: 4px 6px">${siteFinalPayoutSecondPdfData.standardDays || '---'}</td>
//   </tr>
//   <tr>
//     <td style="padding: 4px 6px">No. of Days Reported</td>
//     <td style="text-align: left; padding: 4px 6px">${siteFinalPayoutSecondPdfData.daysReported || '---'}</td>
//   </tr>
//   <tr>
//     <th colspan="4" style="text-align: left; padding: 4px 6px; background-color: black; color: white">Payout Calculations
//     </th>
//   </tr>
//   <tr>
//     <th style="text-align: left; padding: 4px 6px; background-color: #a5a7aaa6;">Package Type</th>
//     <th style="text-align: right; padding: 4px 6px; background-color: #a5a7aaa6;">Unit</th>
//     <th style="text-align: right; padding: 4px 6px; background-color: #a5a7aaa6;">Rate</th>
//     <th style="text-align: right; padding: 4px 6px; background-color: #a5a7aaa6;">Expenditure</th>
//   </tr>
//
// ${siteFinalPayoutSecondPdfData.planRates.map((data, index) => {
//             if (data.status) {
//                 return (
//                     `<tr>
//                     <td style="padding: 4px 6px">${data.name}
//                         <div>(STATUS : ${data.status})</div>
//                     </td>
//                     <td style="text-align: right; padding: 4px 6px">20B9 ${data.units}</td>
//                     <td style="text-align: right; padding: 4px 6px">${data.rate}</td>
//                     <td style="text-align: right; padding: 4px 6px">${ruppeHtmlCode} ${data.subExpenditure || 0}</td>
//                 </tr>`
//                 )
//             } else {
//                 return (
//                     `<tr>
//                     <td style="padding: 4px 6px">${data.name}</td>
//                     <td style="text-align: right; padding: 4px 6px">${data.units}</td>
//                     <td style="text-align: right; padding: 4px 6px">${data.rate}</td>
//                     <td style="text-align: right; padding: 4px 6px">${ruppeHtmlCode} ${data.subExpenditure || 0}</td>
//                 </tr>`
//                 )
//             }
//         })}
//   </tbody>
// </table>
//
// <table class="table-border-none"
//        style="border: none; border-collapse: collapse; font-family: Arial, sans-serif; width: 100%" border="1">
//   <thead style="width: 100%">
//   <tbody>
//   <tr>
//     <th colspan="4" style="text-align: left; padding: 4px 6px; background-color: black; color: white">Payout
//       Details
//     </th>
//   </tr>
//   <tr>
//     <th style="text-align: left; padding: 4px 6px; background-color: #a5a7aaa6; color: #27AE60;">A</th>
//     <th style="text-align: left; padding: 4px 6px; background-color: #a5a7aaa6;">Expenditure</th>
//     <th colspan="2" style="text-align: right; padding: 4px 6px; background-color: #a5a7aaa6;">${ruppeHtmlCode} ${siteFinalPayoutSecondPdfData.totalAmountToBePaid || 0}</th>
//   </tr>
//   <tr>
//     <th style="text-align: left; padding: 4px 6px; background-color: #a5a7aaa6; color: #27AE60;">B</th>
//     <th style="text-align: left; padding: 4px 6px; background-color: #a5a7aaa6;">Additions</th>
//     <th colspan="2" style="text-align: right; padding: 4px 6px; background-color: #a5a7aaa6;">${ruppeHtmlCode} ${siteFinalPayoutSecondPdfData.additions || 0}</th>
//   </tr>
//   ${siteFinalPayoutSecondPdfData.additionsTypes.map((item, index) => {
//             return (
//                 `<tr>
//            <td style="padding: 4px 6px; text-align: left;">#</td>
//     <td>${item.category}</td>
//     <td style="text-align: right;">
//       <span style="text-align: right;">${ruppeHtmlCode} ${item.amount || 0}</span>
//     </td>
//                 </tr>`
//             )
//         })}
//   <tr>
//     <th style="text-align: left; padding: 4px 6px; background-color: #a5a7aaa6; color: #27AE60;">C</th>
//     <th style="text-align: left; padding: 4px 6px; background-color: #a5a7aaa6;">Other Deductions</th>
//     <th colspan="2" style="text-align: right; padding: 4px 6px; background-color: #a5a7aaa6;">${ruppeHtmlCode} ${siteFinalPayoutSecondPdfData.otherDeductions || 0}</th>
//   </tr>
//   ${otherDeductions.map((item, index) => {
//             return (
//                 `<tr>
//            <td style="padding: 4px 6px; text-align: left;">#</td>
//     <td>${item.category}</td>
//     <td style="text-align: right;">
//       <span style="text-align: right;">${ruppeHtmlCode} ${item.amount || 0}</span>
//     </td>
//                 </tr>`
//             )
//         })}
// <!--  <div style='page-break-after:always'></div>-->
//   <tr>
//     <th style="text-align: left; padding: 4px 6px; background-color: #a5a7aaa6; color: #27AE60;">D</th>
//     <th style="text-align: left; padding: 4px 6px; background-color: #a5a7aaa6;">Gross Payout Amount (A+B-C)</th>
//     <th colspan="2" style="text-align: right; padding: 4px 6px; background-color: #a5a7aaa6;">${ruppeHtmlCode} ${siteFinalPayoutSecondPdfData.grossPay || 0}</th>
//   </tr>
//   <tr>
//     <td style="padding: 4px 6px; text-align: left;">#</td>
//     <td>Advance Cycle</td>
//     <td style="text-align: right;">
//       <span>${ruppeHtmlCode} ${siteFinalPayoutSecondPdfData.advancePayout || 0}</span>
//     </td>
//   </tr>
//   <tr>
//     <td style="padding: 4px 6px; text-align: left;">#</td>
//     <td>Final Cycle</td>
//     <td style="text-align: right;">
//       <span>${ruppeHtmlCode} ${siteFinalPayoutSecondPdfData.finalCycleAmount || 0}</span>
//     </td>
//   </tr>
//   <tr>
//     <th style="text-align: left; padding: 4px 6px; background-color: #a5a7aaa6; color: #27AE60;">E</th>
//     <th style="text-align: left; padding: 4px 6px; background-color: #a5a7aaa6;">TDS
//
//     <span>${Services.returnTDSpercentBasedOnPANnumber(siteFinalPayoutSecondPdfData.panNumber) || '--'}</span>
//
//     </th>
//     <th colspan="2" style="text-align: right; padding: 4px 6px; background-color: #a5a7aaa6;">${ruppeHtmlCode} ${siteFinalPayoutSecondPdfData.totalTds || 0}</th>
//   </tr>
//   <tr>
//     <td style="padding: 4px 6px; text-align: left;">#</td>
//     <td>Advance Cycle</td>
//     <td style="text-align: right;">
//       <span>${ruppeHtmlCode} ${siteFinalPayoutSecondPdfData.advanceTds || 0}</span>
//     </td>
//   </tr>
//   <tr>
//     <td style="padding: 4px 6px; text-align: left;">#</td>
//     <td>Final Cycle</td>
//     <td style="text-align: right;">
//       <span>${ruppeHtmlCode} ${siteFinalPayoutSecondPdfData.finalCycleTds || 0}</span>
//     </td>
//   </tr>
//   <tr>
//     <th style="text-align: left; padding: 4px 6px; background-color: #a5a7aaa6; color: #27AE60;">F</th>
//     <th style="text-align: left; padding: 4px 6px; background-color: #a5a7aaa6;">Loss Deductions</th>
//     <th colspan="2" style="text-align: right; padding: 4px 6px; background-color: #a5a7aaa6;">${ruppeHtmlCode} ${siteFinalPayoutSecondPdfData.lossDeductions || 0}</th>
//   </tr>
//     ${lossDeductions.map((item, index) => {
//             return (
//                 `<tr>
//            <td style="padding: 4px 6px; text-align: left;">#</td>
//     <td>${item.category}</td>
//     <td style="text-align: right;">
//       <span style="text-align: right;">${ruppeHtmlCode} ${item.amount || 0}</span>
//     </td>
//                 </tr>`
//             )
//         })}
//   <tr>
//     <th style="text-align: left; padding: 4px 6px; background-color: #a5a7aaa6; color: #27AE60;">F</th>
//     <th style="text-align: left; padding: 4px 6px; background-color: #a5a7aaa6;">Net Payout Amount (D-E)</th>
//     <th colspan="2" style="text-align: right; padding: 4px 6px; background-color: #a5a7aaa6;">${ruppeHtmlCode} ${siteFinalPayoutSecondPdfData.totalNetPay || 0}</th>
//   </tr>
//   <tr>
//     <td style="padding: 4px 6px; text-align: left;">#</td>
//     <td>Advance Payout</td>
//     <td style="text-align: right;">
//       <span>${ruppeHtmlCode} ${siteFinalPayoutSecondPdfData.finalAdvancePayout || 0}</span>
//     </td>
//   </tr>
//   <tr>
//     <td style="padding: 4px 6px; text-align: left;">#</td>
//     <td>Final Payout</td>
//     <td style="text-align: right;">
//       <span>${ruppeHtmlCode} ${siteFinalPayoutSecondPdfData.netPay || 0}</span>
//     </td>
//   </tr>
//   <tr>
//     <td style="padding: 4px 6px; text-align: left;">#</td>
//     <td>Negative Balance (${monthView})</td>
//     <td style="text-align: right;">
//       <span>${ruppeHtmlCode} ${siteFinalPayoutSecondPdfData.negBalanceCurrentMonth || 0}</span>
//     </td>
//   </tr>
//   </tbody>
// </table>
//
// <footer style="margin-top: 30px">This is a system generated payment advice and does not require a signature.</footer>
// </body>
// </html>
//         `;
//         return tempReturnHTMLfields
//     }
//
//     async downloadPayslipAndroid() {
//         // console.log('=======level 1')
//
//         // let date = new Date();
//         // const {config, fs} = RNFetchBlob;
//         // let PictureDir = fs.dirs.DocumentDir;
//         // // const fileName = this.state.setPdfName + '(' + this.state.paySlipSelectedDate + ') Payslip '+ Math.floor(date.getTime() + date.getSeconds() / 2);
//         // const fileName = this.state.setPdfName + '(' + this.state.paySlipSelectedDate + ') Payslip ';
//         // const filePath = `${PictureDir}/${fileName}.pdf`;
//         //
//         // const base64Data = this.state.paySlipData.base64;
//         // const localCreatedFilePath = this.state.paySlipData.filePath;
//         //
//         // console.log('=======level 2')
//         //
//         // await RNFetchBlob.fs.writeFile(filePath, base64Data, 'base64');
//         //
//         // console.log('after write')
//         // if (!fs.exists(filePath)) return;// check to see if our filePath was created
//         //
//         // console.log('=======level 3')
//         // // await RNFetchBlob.fs.cp(file.filePath, filePath);// copies our file to the downloads folder/directory
//         // await RNFetchBlob.fs
//         //     .cp(localCreatedFilePath, filePath)
//         //     .then(() => {
//         //         console.log('=========level 4')
//         //         RNFetchBlob.android.addCompleteDownload({
//         //             title: fileName,
//         //             // title: 'PRAVEEN TEST',
//         //             description: 'Download complete',
//         //             mime: 'application/pdf',
//         //             path: filePath,
//         //             showNotification: true,
//         //         })
//         //         console.log('======level 5')
//         //     })
//         // .then(() =>
//         //     RNFetchBlob.fs.scanFile([
//         //         { path: filePath, mime: 'application/pdf' },
//         //     ])
//         // );
//
//
//
//
//
//         let date = new Date();
//         const {config, fs} = RNFetchBlob;
//         let PictureDir = fs.dirs.DocumentDir;
//         // const fileName = this.state.setPdfName + '(' + this.state.paySlipSelectedDate + ') Payslip '+ Math.floor(date.getTime() + date.getSeconds() / 2);
//         const fileName = this.state.setPdfName + '(' + this.state.paySlipSelectedDate + ') Payslip ';
//         const filePath = `${PictureDir}/${fileName}.pdf`;
//
//         const base64Data = this.state.paySlipData.base64;
//         const localCreatedFilePath = this.state.paySlipData.filePath;
//
//
//
//         const { dirs } = RNFetchBlob.fs;
//         const dirToSave = Platform.OS === 'ios' ? dirs.DocumentDir : dirs.DownloadDir
//         const configfb = {
//             fileCache: true,
//             useDownloadManager: true,
//             notification: true,
//             mediaScannable: true,
//             title: fileName,
//             path: `${dirToSave}/${fileName.pdf}`,
//         }
//         const configOptions = Platform.select({
//             ios: {
//                 fileCache: configfb.fileCache,
//                 title: configfb.title,
//                 path: configfb.path,
//                 appendExt: 'pdf',
//             },
//             android: configfb,
//         });
//
//         console.log('The file saved to 23233====', configfb, dirs);
//
//         RNFetchBlob.config(configOptions)
//             .fetch('GET', `https://aquatherm.s3.ap-south-1.amazonaws.com/pdfs/${fileName.pdf}`, {})
//             .then((res) => {
//                 if (Platform.OS === "ios") {
//                     RNFetchBlob.fs.writeFile(configfb.path, res.data, 'base64');
//                     RNFetchBlob.ios.previewDocument(configfb.path);
//                 }
//                 // setisdownloaded(false)
//
//                 console.log('The file saved to===== ', res);
//             })
//             .catch((e) => {
//                 // setisdownloaded(true)
//                 console.log('The file saved to ERROR=======', e.message)
//             });
//
//
//
//
//         console.log('after cp====')
//         Utils.dialogBox('Payslip Downloaded Successfully', '');
//         // Vibration.vibrate()
//     }
//
//     downloadPayslipIOS = async () => {
//         console.log('=====reached space 1')
//
//         try {
//
//             let date = new Date();
//             const {config, fs} = RNFetchBlob;
//             let PictureDir = fs.dirs.DocumentDir;
//             // const fileName = this.state.setPdfName + '(' + this.state.paySlipSelectedDate + ') Payslip '+ Math.floor(date.getTime() + date.getSeconds() / 2);
//             const fileName = this.state.setPdfName + '(' + this.state.paySlipSelectedDate + ') Payslip ';
//             const filePath = `${PictureDir}/${fileName}.pdf`;
//
//             const base64Data = this.state.paySlipData.base64;
//             const localCreatedFilePath = this.state.paySlipData.filePath;
//
//
//             const selectedFile = this.state.paySlipData.base64;
//
//             var dirType=null;
//             if(Platform.OS === 'ios'){
//                 dirType = RNFS.DocumentDirectoryPath;
//
//             }else{
//                 await this.requestStoragePermission();
//                 dirType = RNFS.ExternalStorageDirectoryPath+'/AppName';
//             }
//
//             console.log('=====reached space 2')
//
//             RNFS.mkdir(dirType+`/Folder`).then(files => {
//                 RNFS.mkdir(dirType+`/Folder/SubFolder`).then(files => {
//                     //console.log(files);
//                 }).catch(err => {
//
//                     //console.log(err.message, err.code);
//
//                 });
//             }).catch(err => {
//
//                 //console.log(err.message, err.code);
//
//             });
//
//             console.log('=====reached space 3')
//
//             var exists = false;
//             RNFS.exists(`${dirType}/Folder/SubFolder/${selectedFile}`).then( (output) => {
//                 console.log('=====reached space 4')
//                 if (output) {
//                     console.log('=====reached space 5')
//                     exists = true;
//                     const path = `${dirType}/Folder/SubFolder/${selectedFile}`;
//                     console.log('=====reached space 6')
//                 } else {
//                     console.log('=====reached space 7')
//                     const selectedFileUrl = selectedFile.replace(/\s/g, '%20');
//
//                     console.log('=====reached space 8')
//
//                     RNFS.downloadFile({
//                         // fromUrl: `https://mywebsite/api/getAttachment?selectedFile=${base64Data}`,
//                         fromUrl:filePath,
//                         toFile: `${dirType}/Folder/SubFolder/${selectedFile}`,
//                         background: true,
//                         begin: (res) => { 9014115624-dikshit
//                             console.log('=====reached space 8.2')
//                             console.log(res);
//                             this.setState({ contentLength: res.contentLength});
//                         },
//                         progress: (res) => {
//                             console.log('=====reached space 8.3')
//                             this.setState({ showSpinner: true });
//                             var prog = res.bytesWritten/res.contentLength
//                             this.setState({ downloaded : prog});
//                             console.log(this.state.downloaded);
//                         }
//                     }).promise.then((r) => {
//                         console.log('=====reached space 9')
//                         //console.log(r);
//                         this.setState({ showSpinner: false });
//                         this.setState({ downloaded : 0});
//                         const path = `${dirType}/${tipoDesc}/${oggetto}/${selectedFile}`;
//                         console.log('=====reached space 10')
//                     }).catch(error => {
//                         console.log('IOS error===2');
//                         console.log(error);
//                     });
//                 }
//             });
//
//
//
//
//         } catch (error) {
//             console.log('IOS error ===1');
//             console.log(error);
//         }
//     };
//
//     async createPDF(apiLevel) {
//         let date = new Date();
//         const {config, fs} = RNFetchBlob;
//         // let PictureDir = fs.dirs.PictureDir;
//         let PictureDir = fs.dirs.DownloadDir;
//         const fileName = this.state.setPdfName+'('+this.state.paySlipSelectedDate+') Payslip '+ Math.floor(date.getTime() + date.getSeconds() / 2); //whatever you want to call your file
//         // const fileName = this.state.setPdfName+ Math.floor(date.getTime() + date.getSeconds() / 2) + 'Payslip'; //whatever you want to call your file
//         const filePath = `${PictureDir}/${fileName}.pdf`;
//         let options = {
//             base64:true,
//             // html: this.returnHTMLfields(),
//             html: this.state.paySlipSelected === 'STAFF_PAYSLIP' ? this.createStaffPayslip() : this.returnHTMLfields(),
//             // fileName: 'Payslip',
//             fileName: fileName,
//             directory: filePath,
//         };
//         let file = await RNHTMLtoPDF.convert(options)
//         this.setState({payslipPreview:true,paySlipData:file,fileName});
//     }
//
//     //Storage Permissions to Download Image
//     async requestDownloadPermissionsForPayslip() {
//         try {
//             const granted = await PermissionsAndroid.request(
//                 PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
//                 {
//                     title: 'Storage Permission Required',
//                     message:
//                         'Whizzard needs access to your storage to download PDF',
//                 }
//             );
//             if (granted === PermissionsAndroid.RESULTS.GRANTED || "granted" === PermissionsAndroid.RESULTS.GRANTED) {
//                 return true
//             } else {
//                 alert('Storage Permission Not Granted');
//                 return false
//             }
//         } catch (err) {
//             console.warn(err);
//         }
//     }
//
//     //Storage Permissions for API 33 to Download Image
//     async requestDownloadPermissionsforAndroid13() {
//         // console.log('reached read perm start #########')
//         try {
//             const granted = await PermissionsAndroid.request(
//                 PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
//                 {
//                     title: 'Storage Permission Required',
//                     message:
//                         'Whizzard needs access to your storage to download PDF',
//                 }
//             );
//             // console.log('asked read media aceess for android 13======')
//             // console.log('asked read perm======',PermissionsAndroid.RESULTS)
//             if (granted === PermissionsAndroid.RESULTS.GRANTED) {
//                 // console.log('granted read media access')
//                 return true
//             } else {
//                 alert('Storage Permission Not Granted');
//                 return false
//             }
//         } catch (err) {
//             // console.log('read perm ====error',err);
//             console.warn(err);
//         }
//     }
//
//     returnEditProfileDetailsView(){
//         const {MyProfileResp, canEditTextInput, checkProfileField} = this.state;
//         return(
//             <View style={[Styles.flex1,]}>
//                 <Appbar.Header style={[Styles.bgDarkRed,  {elevation: 0}]}>
//                     {/*<Appbar.BackAction onPress={() => this.setState({editProfileDetailsModal: false})}/>*/}
//                     <Appbar.Content title="Edit Profile"
//                                     titleStyle={[Styles.ffMbold, Styles.cWhite]}/>
//                     <MaterialIcons name="close" size={32}
//                                             color="#fff" style={{marginRight: 10}}
//                                             onPress={() => this.setState({editProfileDetailsModal: false})}/>
//                 </Appbar.Header>
//                 {MyProfileResp && checkProfileField ?
//                     <ScrollView
//                         style={[Styles.bw1, Styles.bgWhite, {
//                             width: Dimensions.get('window').width,
//                             height: Dimensions.get('window').height
//                         }]}>
//                         <View style={[Styles.p20, Styles.row, Styles.aitCenter]}>
//                             {
//                                 MyProfileResp.profilePicDetails
//                                     ?
//                                     <TouchableOpacity
//                                         style={[Styles.row, Styles.aslCenter]}
//                                         onPress={() => {
//                                             this.setState({
//                                                 imagePreview: true,
//                                                 imagePreviewURL: MyProfileResp.profilePicDetails.profilePicUrl  ?MyProfileResp.profilePicDetails.profilePicUrl  : ''
//                                             })
//                                         }}>
//                                         <ImageBackground
//                                             style={[Styles.img100, Styles.aslCenter, Styles.br50,]}
//                                             source={LoadImages.Thumbnail}>
//                                             <Image
//                                                 style={[Styles.img100, Styles.aslCenter, Styles.br50]}
//                                                 source={MyProfileResp.profilePicDetails.profilePicUrl ? {uri: MyProfileResp.profilePicDetails.profilePicUrl} : null}/>
//                                         </ImageBackground>
//                                         <MaterialIcons name="zoom-in" size={24} color="black"/>
//                                     </TouchableOpacity>
//                                     :
//                                     <FastImage style={[Styles.aslCenter, Styles.img100, Styles.br50]}
//                                                source={LoadImages.user_pic}/>
//                             }
//                             {
//                                 this.state.UserFlow === 'NORMAL' || canEditTextInput
//                                     ?
//                                     <TouchableOpacity
//                                         // onPress={() => this.updateProfilePic()}>
//                                         onPress={() => this.setState({imageSelectionModal:true})}>
//                                         <Text
//                                             style={[Styles.colorRed, Styles.ffMbold, Styles.f18, Styles.pLeft15]}>Change
//                                             Image</Text>
//                                     </TouchableOpacity>
//                                     :
//                                     null
//                             }
//
//
//                         </View>
//                         <View>
//                             <View style={[Styles.padH25]}>
//                                 <View style={[Styles.mBtm20]}>
//                                     <View style={[Styles.row, Styles.aitCenter]}>
//                                         <View>{LoadSVG.personalNew}</View>
//                                         <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15,Styles.cDisabled]}>Name</Text>
//                                     </View>
//                                     <View style={{paddingLeft: 40}}>
//                                         <View
//                                             style={[{
//                                                 borderBottomWidth: 1,
//                                                 borderBottomColor: '#ccc',
//                                                 paddingBottom: 10
//                                             }]}
//                                         ><Text
//                                             style={[Styles.f16, Styles.ffMregular, Styles.pLeft5,Styles.cDisabled]}>{MyProfileResp.fullName}</Text></View>
//                                     </View>
//                                 </View>
//                                 <View style={[Styles.mBtm20]}>
//                                     <View style={[Styles.row, Styles.aitCenter]}>
//                                         <View>{LoadSVG.personalNew}</View>
//                                         <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15,Styles.cDisabled]}>Role</Text>
//                                     </View>
//                                     <View style={{paddingLeft: 40}}>
//                                         <View
//                                             style={[{borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 10}]}
//                                         ><Text
//                                             style={[Styles.f16, Styles.ffMregular, Styles.pLeft5,Styles.cDisabled]}>{Services.returnRoleName(MyProfileResp.role)}</Text></View>
//                                     </View>
//                                 </View>
//                                 <View style={[Styles.mBtm20]}>
//                                     <View style={[Styles.row, Styles.aitCenter]}>
//                                         <View>{LoadSVG.adharIocn}</View>
//                                         <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15,Styles.cDisabled]}>
//                                             Client Employee Id:</Text>
//                                     </View>
//                                     <View style={{paddingLeft: 40}}>
//                                         <View
//                                             style={[{borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 10}]}
//                                         ><Text
//                                             style={[Styles.f16, Styles.ffMregular, Styles.pLeft5,Styles.cDisabled]}>{MyProfileResp.clientEmployeeId || 'NA'}</Text></View>
//                                     </View>
//                                 </View>
//
//                                 <View style={[Styles.mBtm20]}>
//                                     <View style={[Styles.row, Styles.aitCenter]}>
//                                         <View>{LoadSVG.personalNew}</View>
//                                         <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Emergency
//                                             Contact
//                                             Person
//                                             Name{Services.returnRedStart()}</Text>
//                                     </View>
//                                     <View style={{paddingLeft: 40}}>
//                                         <TextInput
//                                             style={[Styles.f16, {
//                                                 borderBottomWidth: 1,
//                                                 borderBottomColor: '#ccc'
//                                             }]}
//                                             placeholder='name'
//                                             editable={this.state.UserFlow === 'NORMAL' ?
//                                                 !(canEditTextInput === false && checkProfileField.contactPersonName) :canEditTextInput}
//                                             value={this.state.contactPersonName}
//                                             onChangeText={(name) => this.setState({contactPersonName: name})}
//                                         />
//                                     </View>
//                                 </View>
//                                 <View style={[Styles.mBtm20]}>
//                                     <View style={[Styles.row, Styles.aitCenter]}>
//                                         <View>{LoadSVG.mobileIcon}</View>
//                                         <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Contact
//                                             Number in
//                                             Emergency{Services.returnRedStart()}</Text>
//                                     </View>
//                                     <View style={{paddingLeft: 40}}>
//                                         <TextInput
//                                             style={[Styles.f16, {
//                                                 borderBottomWidth: 1,
//                                                 borderBottomColor: '#ccc'
//                                             }]}
//                                             placeholder='mobile number'
//                                             editable={this.state.UserFlow === 'NORMAL' ?
//                                                 !(canEditTextInput === false && checkProfileField.emergencyContactNumber):canEditTextInput}
//                                             keyboardType='numeric'
//                                             maxLength={10}
//                                             value={this.state.emergencyContactNumber}
//                                             onChangeText={(number) => this.setState({emergencyContactNumber: number})}
//                                         />
//                                     </View>
//                                 </View>
//                                 <View style={[Styles.mBtm20]}>
//                                     <View style={[Styles.row, Styles.aitCenter]}>
//                                         <View>{LoadSVG.bloodGroup}</View>
//                                         <Text style={[Styles.ffMregular, Styles.f18, Styles.pLeft15]}>Your
//                                             Blood Group{Services.returnRedStart()}</Text>
//                                     </View>
//                                     <View style={{paddingLeft: 40}}>
//                                         <View
//                                             style={[Styles.bw1, Styles.br5, Styles.mTop5, {borderColor: this.state.reqFields ? 'red' : '#ccc',}]}>
//                                             <Picker
//                                                 enabled={this.state.UserFlow === 'NORMAL' ?
//                                                     !(canEditTextInput === false && checkProfileField.bloodGroup):canEditTextInput}
//                                                 itemStyle={[Styles.ffMregular, Styles.f18]}
//                                                 selectedValue={this.state.bloodGroup}
//                                                 mode='dropdown'
//                                                 onValueChange={(itemValue, itemIndex) => this.setState({bloodGroup: itemValue})}
//                                             >
//                                                 {this.state.bloodGroups.map((item, index) => {
//                                                     return (
//                                                         <Picker.Item label={item.name}
//                                                                      value={item.value}
//                                                                      key={index}/>)
//                                                 })}
//                                             </Picker>
//                                         </View>
//                                     </View>
//                                 </View>
//                                 {
//                                     this.state.UserFlow === 'NORMAL' || canEditTextInput
//                                         ?
//                                         <TouchableOpacity
//                                             style={[Styles.defaultbgColor, Styles.p10, Styles.marV20]}
//                                             // onPress={() => this.updateEmergencyContactInfor()}>
//                                             onPress={() => this.ValidateEmergencyDetails('onClickSave')}>
//                                             <Text
//                                                 style={[Styles.aslCenter, Styles.cWhite, Styles.padH10, Styles.padV5, Styles.ffMbold, Styles.f16]}>SAVE</Text>
//                                         </TouchableOpacity>
//                                         :
//                                         null
//                                 }
//
//                             </View>
//                         </View>
//                     </ScrollView>: null
//                 }
//             </View>
//         )
//     }
//
//
//     createStaffPayslip(){
//         const {payslipResponse,otherDeductions,lossDeductions} = this.state
//
//         //td-column
//         //th-head
//         //tr-row
//
//         let payslipMonthData = payslipResponse;
//         let monthView = Services.returnCalendarMonthYear(this.state.paySlipSelectedTimeStamp)
//         let whizzard_http_logo = "http://static1.squarespace.com/static/5ea6d7933221c020e425a06e/5ea9ca54b36fb312e4f183fc/5ffaa8426aadcc43031133da/1610262915144/Whizzard.png?format=1500w"
//
//
//
//         const firstSlip = `
//   <html lang="en" >
// <head>
//   <meta charset="UTF-8">
//   <title>Simpliance Audit</title>
// </head>
// <body>
// <div style="font-family: 'Ubuntu', sans-serif;width: 100%;"
// <!--id="paySlipTable" #paySlipTable *ngIf="payslipMonthData">-->
// <table style="border: none;border-collapse: collapse;font-family: Arial, sans-serif;width: 100%;" border="1">
// <thead style="width: 100%">
// <tr>
// <td style="font-size: 25px; font-weight: 600; padding: 6px 6px; border: none">ZIP ZAP Logistics Private Limited</td>
// <td style="text-align: end; border: none">
// <img src=${whizzard_http_logo}
//          style="height: 90px; width: 150px;"/>
// </td>
// </tr>
// <tr>
// <td style="padding: 6px 6px; border: none">Payment Advice for the month of ${payslipMonthData.payMonth}</td>
// </tr>
// </thead>
// </table>
// <table class="table-border-none" style="border: none;border-collapse: collapse;
// font-family: Arial, sans-serif;width: 100%;" border="1">
// <tbody>
// <tr>
// <td style="width: 25%; vertical-align: top; border-right: 1px solid #9f9d9d !important; border-bottom: none; border-left: none; border-top: none; padding: 0 4px">
// <table style="float: left; width: 100%; padding: 0 5px">
// <tr style="background-color: #343232; color: white;">
// <th colspan="2" style="padding: 10px 10px;">Details</th>
// </tr>
// <tr>
// <td style="padding: 6px 0 0 0 ; font-size: 16px; font-weight: bold; white-space: nowrap">${payslipMonthData.name}</td>
// </tr>
// <tr>
// <td style="font-size: 12px">${payslipMonthData.email || '---'}</td>
// </tr>
// <tr>
// <td style="padding: 10px 0;font-size: 12px">Identification Number</td>
// <th style="padding: 10px 0; text-align: right; font-size: 12px">${payslipMonthData.phoneNumber}</th>
// </tr>
// <tr>
// <td style="padding: 10px 0;font-size: 12px">Role </td>
// <th style="padding: 10px 0; text-align: right;font-size: 12px">${payslipMonthData.roleName}</th>
// </tr>
// <tr>
// <td style="padding: 10px 0; font-size: 12px">City </td>
// <th style="text-align: right; padding: 10px 0; font-size: 12px">${payslipMonthData.city || '---'}</th>
// </tr>
// <tr>
// <td style="padding: 10px 0; font-size: 12px">Bank Name </td>
// <th style="text-align: right; padding: 10px 0; font-size: 12px">${payslipMonthData.nameOfBank}</th>
// </tr>
// <tr>
// <td style="padding: 10px 0; font-size: 12px">Bank Account Number </td>
// <th style="text-align: right; padding: 10px 0; font-size: 12px">${payslipMonthData.accountNumber}</th>
// </tr>
// <tr>
// <td style="padding: 10px 0; font-size: 12px">IFSC Code</td>
// <th style="text-align: right; padding: 10px 0; font-size: 12px">${payslipMonthData.ifscCode}</th>
// </tr>
// <tr>
// <td style="padding: 10px 0; font-size: 12px">PAN</td>
// <th style="text-align: right; padding: 10px 0; font-size: 12px">${payslipMonthData.pan}</th>
// </tr>
// </table>
// </td>
// <td style="border-bottom: none; border-left: none; border-top: none; border-right: none; padding: 0 4px">
// <table style="float: left; width: 100%; padding:0 5px; margin-bottom: 10px">
// <tr style="background-color: #343232; color: white; text-align: left">
// <th colspan="2" style="padding: 10px 10px; ">Earning</th>
// </tr>
// <tr>
// <td style="padding: 10px 5px; font-size: 12px">Contract Service Charge</td>
// <th style="text-align: right;padding: 10px 5px; font-size: 12px">${payslipMonthData.grossPay}</th>
// </tr>
// <tr>
// <td style="padding: 10px 5px; font-size: 12px">Other Allowance</td>
// <th style="text-align: right; padding: 10px 5px; font-size: 12px">${payslipMonthData.otherAllowances}</th>
// </tr>
// <tr>
// <td style="padding: 10px 5px; font-size: 12px">Gross Pay Calculated</td>
// <th style="text-align: right; padding: 10px 5px; font-size: 12px">${payslipMonthData.grossPayCalculated}</th>
// </tr>
// <tr>
// <td style="padding: 10px 5px; font-size: 12px">Over Time Pay</td>
// <th style="text-align: right; padding: 10px 5px; font-size: 12px">${payslipMonthData.overtimePay}</th>
// </tr>
// <tr>
// <td style="padding: 10px 5px; font-size: 12px">Other Earning</td>
// <th style="text-align: right; padding: 10px 5px; font-size: 12px">${payslipMonthData.otherEarnings}</th>
// </tr>
// <tr>
// <td style="padding: 10px 5px; font-size: 12px">Bonus</td>
// <th style="text-align: right; padding: 10px 5px; font-size: 12px">${payslipMonthData.bonus}</th>
// </tr>
// <tr>
// <td style="padding: 10px 5px; font-size: 12px">Deductions</td>
// <!--<th style="text-align: right; padding: 10px 5px; font-size: 12px">(${payslipMonthData.deductions + payslipMonthData.otherDeductions})</th>-->
// </tr>
// <tr>
// <td style="padding: 10px 5px; width: 40%; font-weight: bold; text-align: center;background: #f0eaea82">Total Earnings(Rs)</td>
// <th style="text-align: right;background: #f0eaea82;padding: 10px 5px;">${payslipMonthData.gross}</th>
// </tr>
// </table>
// <table style="float: left; width: 100%; padding:0 5px; margin-bottom: 10px">
// <tr style="background-color: #343232; color:white;">
// <th colspan="2" style="padding: 10px 10px;">Deduction</th>
// </tr>
// <tr>
// <td style="padding: 10px 5px; font-size: 12px">TDS</td>
// <th style="text-align: right; padding: 10px 5px; font-size: 12px">(${payslipMonthData.tds})</th>
// </tr>
// <tr>
// <td style="padding: 10px 5px; font-size: 12px">Advance</td>
// <th style="text-align: right; padding: 10px 5px; font-size: 12px">(0)</th>
// </tr>
// <tr>
// <td style="padding: 10px 5px; width: 40%; font-weight: bold; text-align: center;background: #f0eaea82;">Loss Deductions</td>
// <th style="text-align: right; padding: 10px 5px; background: #f0eaea82; font-size: 12px">${payslipMonthData.lossDeduction}</th>
// </tr>
// </table>
// <table style="float: left; width: 100%; padding:0 5px">
// <tr>
// <th style="padding: 10px 10px;width: 40%; background: #343232; color: white">Net Pay(Rs)</th>
// <th style="text-align: right; padding: 10px 5px; background: #343232; color: white">${payslipMonthData.netPay}</th>
// </tr>
// <tr>
// </tr>
// </table>
// <table style="float: left; width: 100%; padding:0 5px; margin-top: 45px">
// <tr>
// <td colspan="2" style="text-align: center; padding: 10px 5px 0">This is a computer-generated Payment Advice. No signature is required.</td>
// </tr>
// </table>
// </td>
// </tr>
// </tbody>
// </table>
// <hr style="border: 1px solid #9f9d9d">
// </div>
// </body>
// </html>`;
//
//         return firstSlip;
//     }

    fetchHolidaysList() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.FETCH_OFFICE_HOLIDAYS_LIST;
        const body = {};
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    // console.log('holidays====123',response.data);
                    self.setState({holidaysList:response.data,spinnerBool:false, holidaysDisplayModal:true})
                }
            }, function (error) {
                self.errorHandling(error)
            })
        })
    };

    render() {
        const {MyProfileResp, canEditTextInput, checkProfileField,fileName,holidaysList,userRole} = this.state;
        const resourceType = 'url';
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                <OfflineNotice/>
                {this.renderSpinner()}
                {
                    this.state.editProfileDetailsModal
                        ?
                        this.returnEditProfileDetailsView()
                        :
                        <View style={[Styles.flex1, Styles.bgWhite]}>
                            <Appbar.Header style={[Styles.defaultbgColor, {borderBottomWidth: 0}]}>
                                <Appbar.BackAction onPress={() => this.onBack()}/>
                                {
                                    this.state.UserStatus === "ACTIVE"
                                        ?
                                        <Appbar.Content
                                            title={this.state.UserFlow === 'SITE_ADMIN' ? "Update Profile" : "View Profile"}/>
                                        :
                                        <Appbar.Content title="Update Profile"/>
                                }
                                <Appbar.Action icon='mode-edit'
                                               onPress={() => this.setState({editProfileDetailsModal: true})}/>
                            </Appbar.Header>

                            {MyProfileResp
                                ?
                                <ScrollView>
                                    <View style={[Styles.defaultbgColor, Styles.alignCenter, Styles.p15]}>
                                        {
                                            MyProfileResp.profilePicDetails
                                                ?
                                                <TouchableOpacity
                                                    style={[Styles.row, Styles.aslCenter]}
                                                    onPress={() => {
                                                        this.setState({
                                                            imagePreview: true,
                                                            imagePreviewURL: MyProfileResp.profilePicDetails.profilePicUrl ? MyProfileResp.profilePicDetails.profilePicUrl : ''
                                                        })
                                                    }}>
                                                    <ImageBackground
                                                        style={[Styles.img100, Styles.aslCenter, Styles.br50,]}
                                                        source={LoadImages.Thumbnail}>
                                                        <Image
                                                            style={[Styles.img100, Styles.aslCenter, Styles.br50]}
                                                            source={MyProfileResp.profilePicDetails.profilePicUrl ? {uri: MyProfileResp.profilePicDetails.profilePicUrl} : null}/>
                                                    </ImageBackground>
                                                    <MaterialIcons name="zoom-in" size={24} color="black"/>
                                                </TouchableOpacity>
                                                :
                                                <FastImage style={[Styles.aslCenter, Styles.img100, Styles.br50]}
                                                           source={LoadImages.user_pic}/>
                                        }
                                        <Text
                                            style={[Styles.cWhite, Styles.ffMbold, Styles.f20, Styles.padV8]}>{_.startCase(MyProfileResp.fullName) || '--'}</Text>
                                        {
                                            MyProfileResp.siteName
                                                ?
                                                <Text
                                                    style={[Styles.cWhite, Styles.ffMregular, Styles.f16]}>{MyProfileResp.siteName + ' (' + (MyProfileResp.siteCode) + ')'}</Text>
                                                :
                                                <Text
                                                    style={[Styles.cWhite, Styles.ffMregular, Styles.f16]}>{'--' + ' ' + '--'}</Text>
                                        }
                                        {
                                            MyProfileResp.contactNumber
                                                ?
                                                <View style={[Styles.row, Styles.jCenter, Styles.padV5]}>
                                                    <Text
                                                        style={[Styles.cWhite, Styles.ffMregular, Styles.f16]}>{Services.returnRoleName(MyProfileResp.role)}</Text>
                                                    <Text
                                                        style={[Styles.cWhite, Styles.ffMregular, Styles.f16, Styles.padH10]}>||</Text>
                                                    <Text
                                                        style={[Styles.cWhite, Styles.ffMregular, Styles.f16,]}>{MyProfileResp.contactNumber}</Text>
                                                </View>
                                                :
                                                <View style={[Styles.row, Styles.jCenter, Styles.padV5]}>
                                                </View>
                                        }

                                    </View>
                                    <View>
                                        <View style={[styles.shadow]}>
                                            <Card
                                                onPress={() => this.props.navigation.navigate('NewPersonalScreen', {
                                                    selectedProfileUserID: MyProfileResp.userId,
                                                    UserFlow: this.state.UserFlow
                                                })}
                                                style={[Styles.p10, styles.borderLine]}>
                                                <Card.Title title="Personal Information"
                                                            subtitle={MyProfileResp.personalInfoRatio === 10 ? 'Not Started' : 'Aadhar, PAN, Address'}
                                                            titleStyle={[Styles.ffMbold, Styles.f18]}
                                                            subtitleStyle={[Styles.ffMregular, Styles.f12, Styles.padV5]}
                                                            left={() => <View>{LoadSVG.userIconVoilet}</View>}
                                                            right={() =>
                                                                <View style={[Styles.row, Styles.alignCenter]}>
                                                                    <View style={[styles.circleStyle]}>
                                                                        <Text>{MyProfileResp.personalInfoRatio ? MyProfileResp.personalInfoRatio : 0}%</Text>
                                                                    </View>
                                                                    <MaterialIcons name="chevron-right" size={32}/>
                                                                </View>
                                                            }
                                                />
                                            </Card>
                                            <Card
                                                onPress={() => this.props.navigation.navigate('VehicleDetailsScreen', {
                                                    selectedProfileUserID: MyProfileResp.userId,
                                                    UserFlow: this.state.UserFlow
                                                })}
                                                style={[Styles.p10, styles.borderLine]}>
                                                <Card.Title title="Vehicle Details"
                                                            subtitle={MyProfileResp.vehicleInfoRatio === 10 ? 'Not Started' : 'Tax, Pollution, Insurance, Fitness'}
                                                            titleStyle={[Styles.ffMbold, Styles.f18]}
                                                            subtitleStyle={[Styles.ffMregular, Styles.f12, Styles.padV5]}
                                                            left={() => <View>{LoadSVG.vehicleNew}</View>}
                                                            right={() =>
                                                                <View style={[Styles.row, Styles.alignCenter]}>
                                                                    <View style={[styles.circleStyle]}>
                                                                        <Text>{MyProfileResp.vehicleInfoRatio ? MyProfileResp.vehicleInfoRatio : 0}%</Text>
                                                                    </View>
                                                                    <MaterialIcons name="chevron-right" size={32}/>
                                                                </View>
                                                            }
                                                />
                                            </Card>
                                            <Card
                                                onPress={() => this.props.navigation.navigate('BankDetailsScreen', {
                                                    selectedProfileUserID: MyProfileResp.userId,
                                                    UserFlow: this.state.UserFlow
                                                })}
                                                style={[Styles.p10, styles.shadow]}>
                                                <Card.Title title="Bank Details"
                                                            subtitle={MyProfileResp.bankInfoRatio === 10 ? 'Not Started' : 'Bank, IFSC, Account'}
                                                            titleStyle={[Styles.ffMbold, Styles.f18]}
                                                            subtitleStyle={[Styles.ffMregular, Styles.f12, Styles.padV5]}
                                                            left={() => <View>{LoadSVG.bankNew}</View>}
                                                            right={() =>
                                                                <View style={[Styles.row, Styles.alignCenter]}>
                                                                    <View style={[styles.circleStyle]}>
                                                                        <Text>{MyProfileResp.bankInfoRatio ? MyProfileResp.bankInfoRatio : 0}%</Text>
                                                                    </View>
                                                                    <MaterialIcons name="chevron-right" size={32}/>
                                                                </View>
                                                            }
                                                />
                                            </Card>
                                        </View>
                                        <View style={[Styles.padH30, Styles.pTop20]}>
                                            <Text style={[Styles.f18, Styles.ffMregular, {color: '#ccc'}]}>Other Account
                                                Info</Text>
                                            <View
                                                style={[Styles.row, Styles.jSpaceBet, Styles.aitCenter, Styles.padV20, styles.borderBottmLine]}>
                                                <Text style={[Styles.ffMbold, Styles.f18]}>Blood Group</Text>
                                                <Text
                                                    style={[Styles.ffMbold, Styles.f16]}>{MyProfileResp.bloodGroup ? MyProfileResp.bloodGroup : 'NA'}</Text>
                                            </View>
                                            <View
                                                style={[Styles.row, Styles.jSpaceBet, Styles.aitCenter, Styles.padV20, styles.borderBottmLine]}>
                                                <Text style={[Styles.ffMbold, Styles.f18]}>Emergency Contact</Text>
                                                <TouchableOpacity onPress={() => {
                                                    Linking.openURL(`tel:${MyProfileResp.emergencyContact}`)
                                                }}><Text
                                                    style={[Styles.ffMbold, Styles.f16]}>{MyProfileResp.emergencyContact ? MyProfileResp.emergencyContact : 'NA'}</Text></TouchableOpacity>
                                            </View>

                                            {
                                                MyProfileResp.userStatus === 'ACTIVATED' && userRole >= '27'
                                                    ?
                                                    <TouchableOpacity onPress={()=>this.fetchHolidaysList()}
                                                                      style={[Styles.row, Styles.jSpaceBet, Styles.aitCenter, Styles.padV20, styles.borderBottmLine]}>
                                                        <Text style={[Styles.ffMbold, Styles.f18]}>Holidays List</Text>
                                                        <MaterialIcons name="chevron-right" size={32}/>
                                                    </TouchableOpacity>
                                                    :
                                                    null
                                            }

                                            {
                                                MyProfileResp.userStatus === 'ACTIVATED'
                                                    ?
                                                    <TouchableOpacity onPress={() => this.getUserInsuranceCard()}
                                                                      style={[Styles.row, Styles.jSpaceBet, Styles.aitCenter, Styles.padV20, styles.borderBottmLine]}>
                                                        <Text style={[Styles.ffMbold, Styles.f18]}>Insurance Card</Text>
                                                        <MaterialIcons name="chevron-right" size={32}/>
                                                    </TouchableOpacity>
                                                    :
                                                    null
                                            }

                                            {
                                                //can visible to all user status
                                                // MyProfileResp.userStatus === 'ACTIVATED' &&
                                                this.state.UserFlow === 'NORMAL'
                                                && (MyProfileResp.role === 'ASSOCIATE' || MyProfileResp.role === 'DRIVER' || MyProfileResp.role === 'DRIVER_AND_ASSOCIATE' || MyProfileResp.role === 'LABOURER' || MyProfileResp.role === 'LOADER' )
                                                    ?
                                                    <TouchableOpacity
                                                        onPress={()=>this.setState({monthFilterModal:true,paySlipSelected : 'FLEET_PAYSLIP'})
                                                        }
                                                        style={[Styles.row, Styles.jSpaceBet, Styles.aitCenter, Styles.padV20, styles.borderBottmLine]}>
                                                        <Text style={[Styles.ffMbold, Styles.f18]}>Fleet Payslip</Text>
                                                        <MaterialIcons name="calendar-month" size={32} />
                                                    </TouchableOpacity>
                                                    :
                                                    null
                                            }

                                            {
                                                MyProfileResp.userStatus === 'ACTIVATED' &&
                                                this.state.UserFlow === 'NORMAL'
                                                && (MyProfileResp.role === 'PROCESS_ASSOCIATE' || MyProfileResp.role === 'SHIFT_LEAD' || MyProfileResp.role === 'HUB_MANAGER' )
                                                    ?
                                                    <TouchableOpacity
                                                        // onPress={()=>this.getStaffPayslip()
                                                        onPress={()=>this.setState({monthFilterModal:true,paySlipSelected : 'STAFF_PAYSLIP'})
                                                        }
                                                        style={[Styles.row, Styles.jSpaceBet, Styles.aitCenter, Styles.padV20, styles.borderBottmLine]}>
                                                        <Text style={[Styles.ffMbold, Styles.f18]}>Staff Payslip</Text>
                                                        <MaterialIcons name="calendar-month" size={32} />
                                                    </TouchableOpacity>
                                                    :
                                                    null
                                            }

                                            <TouchableOpacity onPress={() => this.getUserIdCardInfo()}
                                                              style={[Styles.row, Styles.jSpaceBet, Styles.aitCenter, Styles.padV20, styles.borderBottmLine]}>
                                                <Text style={[Styles.ffMbold, Styles.f18]}>ID Card</Text>
                                                <MaterialIcons name="chevron-right" size={32}/>
                                            </TouchableOpacity>
                                            <View
                                                style={[Styles.row, Styles.jSpaceBet, Styles.aitCenter, Styles.padV20]}>
                                                <Text style={[Styles.ffMbold, Styles.f18]}>Verification Status</Text>
                                                <Text
                                                    style={[Styles.ffMbold, Styles.f16, Styles.colorGreen]}>{MyProfileResp.userStatus === 'ACTIVATED' ? 'Verified' : 'Pending'}</Text>
                                            </View>
                                            {
                                                MyProfileResp.userStatus === 'ACTIVATED'
                                                    ?
                                                    <TouchableOpacity onPress={() => this.getUserContractInfo()}
                                                                      style={[Styles.row, Styles.jSpaceBet, Styles.aitCenter, Styles.padV20, styles.borderBottmLine]}>
                                                        <Text style={[Styles.ffMbold, Styles.f18]}>Contract
                                                            Agreement</Text>
                                                        {/*<Text style={[Styles.ffMbold, Styles.f16, Styles.colorGreen]}>View</Text>*/}
                                                        <MaterialIcons name="chevron-right" size={32}/>
                                                    </TouchableOpacity>
                                                    :
                                                    null
                                            }
                                        </View>
                                        <Divider style={[styles.shadow, {borderWidth: 0}]}/>
                                        <View style={[Styles.padH30, Styles.padV20]}>
                                            <Text style={[Styles.f18, Styles.ffMregular, {color: '#ccc'}]}>User
                                                Activity</Text>
                                            <View
                                                style={[Styles.row, Styles.jSpaceBet, Styles.aitCenter, Styles.padV20, styles.borderBottmLine]}>
                                                <Text style={[Styles.ffMbold, Styles.f18]}>You are referred by</Text>
                                                <Text
                                                    style={[Styles.ffMbold, Styles.f16]}>{MyProfileResp.referredBy === null ? 'NA' : MyProfileResp.referredBy}</Text>
                                            </View>
                                            <View
                                                style={[Styles.row, Styles.jSpaceBet, Styles.aitCenter, Styles.padV20]}>
                                                <Text style={[Styles.ffMbold, Styles.f18]}>Last Login</Text>
                                                {/*<Text style={[Styles.ffMbold, Styles.f16]}>13 July 2020 | 14:03 Hrs</Text>*/}
                                                <Text style={[Styles.ffMbold, Styles.f16]}>{MyProfileResp.userLastLogIn
                                                    ? Services.returnConvertTimeToAMPM(new Date(this.state.MyProfileResp.userLastLogIn)) : 'NA'}</Text>
                                            </View>
                                        </View>
                                        <Divider style={[styles.shadow]}/>
                                        <View style={[Styles.padH30, Styles.pTop20]}>
                                            <View style={[Styles.padV15,]}>
                                                <FastImage source={LoadImages.whizzard_inverted}
                                                           style={[Styles.aslCenter, {width: 200, height: 40}]}/>
                                            </View>
                                            <View style={[Styles.row, Styles.jSpaceBet, Styles.pBtm10]}>
                                                {/*<Text style={[Styles.ffMregular, Styles.f16]}>V2.5.30</Text>*/}
                                                <Text
                                                    style={[Styles.ffMblack, {color: Services.returnServerBasedColor()}]}>v.{Config.routes.APP_VERSION_NUMBER}</Text>
                                                <Text style={[Styles.ffMregular, Styles.f16]}>|</Text>
                                                <TouchableOpacity
                                                    onPress={() => Linking.openURL(`https://docs.google.com/document/d/e/2PACX-1vQOmqz0IMPq5e4b5Nv36CXcaDuqWLym8kOpLIHvm45H4o7XV4A0OxYO96I-C2knR4TI4AUFJp_MXSdD/pub`)}>
                                                    <Text style={[Styles.ffMregular, Styles.f16]}>Terms &
                                                        Conditions</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </ScrollView>
                                :
                                <CSpinner/>
                            }
                        </View>
                }

                {/*MODAL START*/}

                {/*Edit Profile Details Modal*/}
                {/*<Modal*/}
                {/*    transparent={true}*/}
                {/*    animated={true}*/}
                {/*    animationType='slide'*/}
                {/*    visible={this.state.editProfileDetailsModal}*/}
                {/*    onRequestClose={() => {*/}
                {/*        this.setState({editProfileDetailsModal:false})*/}
                {/*    }}>*/}
                {/*    <View style={[Styles.modalfrontPosition]}>*/}
                {/*        {  this.state.spinnerBool === false  ?  null  :  <CSpinner/>  }*/}
                {/*        {this.returnEditProfileDetailsView()}*/}
                {/*    </View>*/}
                {/*</Modal>*/}

                {/*Holidays list modal*/}
                <Modal
                    transparent={true}
                    visible={this.state.holidaysDisplayModal}
                    onRequestClose={() => {
                        this.setState({holidaysDisplayModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({holidaysDisplayModal: false})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        <View
                            style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br10, Styles.mBtm20, {
                                width: Dimensions.get('window').width - 20,
                                height: Dimensions.get('window').height / 1.4
                            }]}>
                            <View style={[Styles.aslCenter]}>
                                <Text style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.marV10, Styles.colorBlue,{borderBottomWidth: 1}]}>Holidays List</Text>
                            </View>
                            {
                                holidaysList
                                    ?
                                    <ScrollView>
                                        {
                                            holidaysList.map((item,index)=>{
                                                return(
                                                    <View
                                                        style={[ Styles.p10,Styles.row,Styles.jSpaceBet,{
                                                            backgroundColor: (index % 2) === 0 ? '#ffcccb' : '#f6e1c8'
                                                        }]}>
                                                        <Text style={[Styles.ffMbold, Styles.colorBlue,Styles.flex1]}>{Services.convertDateintoGeneralFormat(item.date)} - {Services.returnWeekdayNameinShortForm(item.day)}</Text>
                                                        <Text style={[Styles.ffMbold, Styles.colorBlue,Styles.flex1]}>{item.event}</Text>
                                                    </View>
                                                )
                                            })
                                        }
                                    </ScrollView> : null
                            }
                        </View>
                    </View>
                </Modal>

                {/*INSURANCE DETAILS MODAL*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.insuranceCardModal}
                    onRequestClose={() => {
                        this.setState({insuranceCardModal:false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.bgLYellow,]}>
                            <Appbar.Header style={[Styles.defaultbgColor, Styles.jSpaceBet]}>
                                <Appbar.Content title="Insurance Details"
                                                titleStyle={[Styles.ffMbold, Styles.cWhite]}/>
                                <MaterialIcons name="file-download" style={[Styles.padH20]} size={28} color="black"
                                                        onPress={()=>Linking.openURL(this.state.insuranceCard)}
                                />
                                <MaterialIcons name="close" size={28}
                                                        color="#000" style={{marginRight: 10}}
                                                        onPress={() => this.setState({insuranceCardModal: false})}/>
                            </Appbar.Header>
                            {/* Some Controls to change PDF resource */}
                            {/*<PDFView*/}
                            {/*    fadeInDuration={250.0}*/}
                            {/*    style={[{  width: Dimensions.get('window').width,*/}
                            {/*        height: Dimensions.get('window').height-50 }]}*/}
                            {/*    resource={this.state.insuranceCard}*/}
                            {/*    resourceType={"url"}*/}
                            {/*    onLoad={() => console.log(`PDF rendered from ${resourceType}`)}*/}
                            {/*    onError={(error) => console.log('Cannot render PDF', error)}*/}
                            {/*/>*/}
                        </View>
                    </View>
                </Modal>

                {/*ID CARD MODAL*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.idCardDetailsModal}
                    onRequestClose={() => {
                        this.setState({idCardDetailsModal:false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.bgWhite,]}>
                            <Appbar.Header style={[Styles.defaultbgColor, Styles.jSpaceBet]}>
                                <Appbar.Content title="ID Card"
                                                titleStyle={[Styles.ffMbold, Styles.cWhite]}/>
                                <MaterialIcons name="file-download" style={[Styles.padH20]}
                                                        size={28} color="black"
                                                        onPress={()=>this.requestDownloadPermissions()}/>
                                <MaterialIcons name="close" size={28}
                                                        color="#000" style={{marginRight: 10}}
                                                        onPress={() => this.setState({idCardDetailsModal: false})}/>
                            </Appbar.Header>

                            <ScrollView
                                persistentScrollbar={true}
                                // showsVerticalScrollIndicator={true}
                                style={[{  width: Dimensions.get('window').width,
                                height: Dimensions.get('window').height-50 }]}>
                                {
                                    this.state.idCardInfo.idCardFrontCopyUrl
                                        ?
                                        <View>
                                            <Image
                                                onLoadStart={() => this.setState({idCardFrontLoading: true})}
                                                onLoadEnd={() => this.setState({idCardFrontLoading: false})}
                                                style={[{
                                                    width: Dimensions.get('window').width -50,
                                                    height: Dimensions.get('window').height-120
                                                }, Styles.marV15,Styles.bgWhite, Styles.aslCenter, Styles.ImgResizeModeStretch]}
                                                source={this.state.idCardInfo.idCardFrontCopyUrl ? {uri: this.state.idCardInfo.idCardFrontCopyUrl} : null}
                                            />
                                            <ActivityIndicator
                                                style={[Styles.ImageUploadActivityIndicator]}
                                                animating={this.state.idCardFrontLoading}
                                            />
                                        </View>
                                        :
                                        null
                                }

                                {
                                    this.state.idCardInfo.idCardBackCopyUrl
                                        ?
                                        <View>
                                            <Image
                                                onLoadStart={() => this.setState({idCardBackLoading: true})}
                                                onLoadEnd={() => this.setState({idCardBackLoading: false})}
                                                style={[{
                                                    width: Dimensions.get('window').width -50,
                                                    height: Dimensions.get('window').height-120
                                                }, Styles.marV15, Styles.aslCenter,Styles.bgWhite, Styles.ImgResizeModeStretch]}
                                                source={this.state.idCardInfo.idCardBackCopyUrl ? {uri: this.state.idCardInfo.idCardBackCopyUrl} : null}
                                            />
                                            <ActivityIndicator
                                                style={[Styles.ImageUploadActivityIndicator]}
                                                animating={this.state.idCardBackLoading}
                                            />
                                        </View>
                                        :
                                        null
                                }
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/*CONTRACT MODAL*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.contractDetailsModal}
                    onRequestClose={() => {
                        this.setState({contractDetailsModal:false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.pTop10]}>
                            <Appbar.Header style={[Styles.bgDarkRed]}>
                                <Appbar.Content title="Contract Agreement"
                                                titleStyle={[Styles.ffMbold, Styles.cWhite]}/>
                                <MaterialIcons name="file-download" style={[Styles.padH20]} size={28} color="black"
                                                        onPress={()=>Linking.openURL(this.state.contractInfo)}
                                    // onPress={()=>Linking.openURL(contractPDFurl)}
                                />
                                <MaterialIcons name="close" size={28}
                                                        color="#000" style={{marginRight: 10}}
                                                        onPress={() => this.setState({contractDetailsModal: false})}/>
                            </Appbar.Header>
                            <View style={[Styles.bgLYellow,]}>
                                {/*{*/}
                                {/*    this.state.contractInfo*/}
                                {/*        ?*/}
                                {/*        <PDFView*/}
                                {/*            fadeInDuration={250.0}*/}
                                {/*            style={[{  width: Dimensions.get('window').width,*/}
                                {/*                height: Dimensions.get('window').height-50 }]}*/}
                                {/*            resource={this.state.contractInfo}*/}
                                {/*            // resource={contractPDFurl}*/}
                                {/*            resourceType={"url"}*/}
                                {/*            onLoad={() => console.log(`PDF rendered from ${resourceType}`)}*/}
                                {/*            onError={(error) => console.log('Cannot render PDF', error)}*/}
                                {/*        />*/}
                                {/*        :*/}
                                {/*        <Text style={[Styles.colorBlue, Styles.f20, Styles.aslCenter, Styles.ffMregular,Styles.pTop20]}>No Contract Found....</Text>*/}
                                {/*}*/}
                            </View>
                        </View>
                    </View>
                </Modal>

                {/*Images Preview Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.imagePreview}
                    onRequestClose={() => {
                        this.setState({imagePreview: false, imagePreviewURL: ''})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgWhite, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <Appbar.Header style={[Styles.bgDarkRed, Styles.jSpaceBet]}>
                                <Appbar.Content title="Image Preview"
                                                titleStyle={[Styles.ffMbold]}/>
                                <MaterialIcons name="close" size={32}
                                                        color="#fff" style={{marginRight: 10}}
                                                        onPress={() =>
                                                            this.setState({imagePreview: false, imagePreviewURL: ''})
                                                        }/>
                            </Appbar.Header>
                            <View style={[Styles.flex1]}>
                                {
                                    this.state.imagePreviewURL
                                        ?
                                        <View>
                                            <View style={[Styles.row,Styles.jSpaceBet]}>
                                                <View/>
                                                <TouchableOpacity style={[Styles.row,Styles.marH10 ]}
                                                                  onPress={() => {this.rotate()} }>
                                                    <Text style={[Styles.colorBlue,Styles.f18,Styles.padH5]}>ROTATE</Text>
                                                    <FontAwesome name="rotate-right" size={22} color="black"
                                                    />
                                                </TouchableOpacity>
                                            </View>

                                            <ImageZoom cropWidth={Dimensions.get('window').width}
                                                       cropHeight={Dimensions.get('window').height-110}
                                                       imageWidth={Dimensions.get('window').width }
                                                       imageHeight={Dimensions.get('window').height}>
                                                <Image
                                                    onLoadStart={() => this.setState({previewLoading: true})}
                                                    onLoadEnd={() => this.setState({previewLoading: false})}
                                                    style={[{
                                                        width: Dimensions.get('window').width - 20,
                                                        height: Dimensions.get('window').height - 90,
                                                        transform: [{rotate: this.state.imageRotate+'deg'}]
                                                    }, Styles.marV5, Styles.aslCenter, Styles.bgDWhite,Styles.ImgResizeModeContain]}
                                                    source={this.state.imagePreviewURL ? {uri: this.state.imagePreviewURL} : null}
                                                />
                                            </ImageZoom>
                                            <ActivityIndicator
                                                // style={[Styles.ImageUploadActivityIndicator]}
                                                animating={this.state.previewLoading}
                                            />
                                        </View>
                                        :
                                        null
                                }

                            </View>


                        </View>
                    </View>
                </Modal>


                {/*MODAL FOR IMAGE UPLOAD SELECTION*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.imageSelectionModal}
                    onRequestClose={() => {
                        this.setState({imageSelectionModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({imageSelectionModal: false})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        <View
                        style={[Styles.bgWhite, Styles.aslCenter, Styles.p10,  {width: Dimensions.get('window').width - 80}]}>

                            <View style={[Styles.p10]}>
                                <Text style={[Styles.f22,Styles.cBlk,Styles.txtAlignCen,Styles.ffLBlack,Styles.pBtm10]}>Add Image</Text>
                                <View style={[Styles.marV15]}>
                                    <TouchableOpacity
                                        onPress={()=>{this.setState({imageSelectionModal:false},()=>{
                                            this.updateProfilePic('CAMERA')
                                        })}}
                                        activeOpacity={0.7} style={[Styles.marV10,Styles.row,Styles.aitCenter]}>
                                        <FontAwesome name="camera" size={24} color="black" />
                                        <Text style={[Styles.f20,Styles.cBlk,Styles.ffLBold,Styles.padH10]}>Take Photo</Text>
                                    </TouchableOpacity>
                                    <Text style={[Styles.ffLBlack,Styles.brdrBtm1,Styles.mBtm15]}/>
                                    <TouchableOpacity
                                        onPress={()=>{this.setState({imageSelectionModal:false},()=>{
                                            this.updateProfilePic('LIBRARY')
                                        })}}
                                        activeOpacity={0.7} style={[Styles.marV10,Styles.row,Styles.aitCenter]}>
                                        <FontAwesome name="folder" size={24} color="black" />
                                        <Text style={[Styles.f20,Styles.cBlk,Styles.ffLBold,Styles.padH10]}>Gallery</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                        </View>
                    </View>
                </Modal>

                {/*MODAL FOR MONTH_YEAR filter*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.monthFilterModal}
                    onRequestClose={() => {
                        this.setState({monthFilterModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({monthFilterModal: false})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        <View
                            style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br15, {width: Dimensions.get('window').width - 100}]}>
                            <MonthSelectorCalendar
                                onMonthTapped={(date) => {
                                    // let tempDate = Services.returnCalendarMonthYearNumber(date)
                                    let tempDate = Services.returnCalendarMonthYearNumber(new Date(date))
                                    let tempDateforAPI = Services.returnCalendarMonthYearNumberForStaff(new Date(date))
                                    this.setState({paySlipSelectedDate: tempDate,
                                        paySlipSelectedDateforAPI : tempDateforAPI,
                                        paySlipSelectedTimeStamp:date, monthFilterModal: false},()=>{
                                        this.state.paySlipSelected === 'STAFF_PAYSLIP' ? this.getStaffPayslip() : this.getFleetPayslip()
                                    })
                                }}
                            />
                        </View>
                    </View>
                </Modal>

                {/*PAYSLIP PREVIEW MODAL*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.payslipPreview}
                    onRequestClose={() => {
                        this.setState({payslipPreview:false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.bgWhite,]}>
                            <Appbar.Header style={[Styles.defaultbgColor, Styles.jSpaceBet]}>
                                <Appbar.Content title={fileName}
                                                titleStyle={[Styles.ffMbold, Styles.cWhite]}/>
                                {
                                    Platform.OS === 'ios'
                                        ?
                                        null
                                        :
                                        <MaterialIcons name="file-download" style={[Styles.padH20]}
                                                                size={28} color="black"
                                                                onPress={() => Platform.OS === 'ios' ? this.downloadPayslipIOS() : this.downloadPayslipAndroid()}/>
                                }
                                <MaterialIcons name="close" size={28}
                                                        color="#000" style={{marginRight: 10}}
                                                        onPress={() => this.setState({payslipPreview: false})}/>
                            </Appbar.Header>

                            <ScrollView
                                persistentScrollbar={true}
                                // showsVerticalScrollIndicator={true}
                                style={[{  width: Dimensions.get('window').width,
                                    height: Dimensions.get('window').height-50 }]}>
                                {/*{*/}
                                {/*    this.state.paySlipData.base64*/}
                                {/*        ?*/}
                                {/*        <PDFView*/}
                                {/*            fadeInDuration={250.0}*/}
                                {/*            style={[{  width: Dimensions.get('window').width,*/}
                                {/*                height: Dimensions.get('window').height }]}*/}
                                {/*            resource={this.state.paySlipData.base64}*/}
                                {/*            resourceType={"base64"}*/}
                                {/*            onLoad={() => console.log(`PDF rendered from`)}*/}
                                {/*            onError={(error) => console.log('Cannot render PDF', error)}*/}
                                {/*        />*/}
                                {/*        :*/}
                                {/*        <Text style={[Styles.colorBlue, Styles.f20, Styles.aslCenter, Styles.ffMregular,Styles.pTop20]}>No Payslip Found....</Text>*/}
                                {/*}*/}

                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/*MODALS END*/}


            </View>
        );
    }
}

const styles = StyleSheet.create({
    circleStyle: {
        height: 45, width: 45,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: '#a7a7a7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    borderLine: {
        borderTopWidth: 3, borderTopColor: '#f6f6f6'
    },
    borderBottmLine: {
        borderBottomWidth: 3, borderBottomColor: '#f6f6f6'
    },
    gridBorder: {
        borderTopWidth: 5, borderTopColor: '#f6f6f6'
    },
    shadow: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 1.62,
        elevation: 3,
    }
});
