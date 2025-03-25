import React from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Linking,
    Modal,
    PermissionsAndroid,
    ScrollView, StyleSheet,
    Text,
    TextInput, TouchableHighlight,
    TouchableOpacity,
    View
} from 'react-native';
import {CSpinner, CText, LoadSVG, Styles} from '../common'
import Utils from "../common/Utils";
import Config from "../common/Config";
import Services from "../common/Services";
import {Appbar, DefaultTheme, RadioButton, Checkbox, Card} from "react-native-paper";
import OfflineNotice from '../common/OfflineNotice';
import HomeScreen from "../HomeScreen";
import _ from "lodash";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import Geolocation from "react-native-geolocation-service";
 import {Column as Col, Row} from "react-native-flexbox-grid";
import Ionicons from "react-native-vector-icons/dist/Ionicons";
import ImageZoom from "react-native-image-pan-zoom";
import SignatureCapture from "react-native-signature-capture";
import {PERMISSIONS, request} from "react-native-permissions";


const options = {
    title: 'Select Avatar',
    storageOptions: {
        skipBackup: true,
        path: 'images',
    },
    maxWidth: 1200, maxHeight: 800,
};

const winW = Dimensions.get('window').width;
const winH = Dimensions.get('window').height;
export default class OrdersEndScreen extends React.Component {

    constructor(props) {
        super(props);
        // this.requestLocationPermission()
        this.state = {
            spinnerBool: false,
            orderData: [],
            cashCollected: '',
            OrderNotDeliveredReasonsList: [{reason: 'Customer not available', value: '1', status: 'ATTEMPTED'},
                // {reason: 'Cutomer not accepting orders', value: '2', status: 'REJECTED'},
                {reason: 'Address not reachable', value: '3', status: 'ATTEMPTED'},
                {reason: 'Others', value: '4', status: 'ATTEMPTED'}],
            currentLocation: [],
            // latitude: null,
            // longitude: null,
            GPSasked: false, swipeActivated: false, picUploaded: false, ImageData: '', ImageFormData: '',
            showOrderItemsList: true,
            itemIds: [],
            selectedItemId: false,
            status: '',
          paymentTypeValidation: false,showSummaryDetailsModal:false,summaryDetailsConfirmed:false,finalList:[],
            imagePreview: false, imagePreviewURL: '',imageRotate:'0',
            imageSelectionModal:false,
            otpVerificationModal:false,otpDigits: '',otpErrorMessage:'',satisfiedOTP:false,
            SignatureModal: false, SignatureURL: '',signatureDragged: false,satisfiedSignature:false,
            deliveryImagesArray:[]
        };
    }

    componentDidMount() {
        const self = this;
        // this._subscribe = this.props.navigation.addListener('didFocus', () => {
            // this.requestCameraPermission()
            this.requestLocationPermission();
            let tempData = self.props.navigation.state.params.orderData
            self.setState({
                orderData: tempData,
                orderAmount: tempData.orderTotal,
                cashCollected: tempData.paymentType === "COD" ? '' : JSON.stringify(tempData.payment.amount_ordered),
                paymentTypeValidation: tempData.paymentType === "COD" ? false : true,
                shiftId: self.props.navigation.state.params.shiftId,
            }, () => {
                console.log('end order data',tempData);
                const updatedData = [];
                const tempList = tempData.orderItems;
                for (let i = 0; i < tempList.length; i++) {
                    let tempPos = tempList[i]
                    tempPos.selectedItemId = false
                    tempPos.delivered = tempList[i].remainingQuantity ? tempList[i].remainingQuantity: tempList[i].deliveredQuantity
                    tempPos.rejected = tempList[i].rejectedQuantity
                    updatedData.push(tempPos)
                }
                if (tempList.length === 0) {
                    self.setState({showOrderItemsList:false})
                }
                self.setState({orderItems: updatedData})
            })
        // });
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    errorHandling(error) {
        console.log("error", error, error.response);
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

    async requestCameraPermission() {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                await this.requestLocationPermission();
            } else {
                Utils.dialogBox('Camera permission denied', '');
                this.props.navigation.goBack();
            }
        } catch (err) {
            Utils.dialogBox('err', '');
            console.warn(err);
        }
    }

    requestLocationPermission = async()=> {
        // this.getCurrentLocation()
        try {
            const granted = request(Platform.OS === 'ios' ?
                PERMISSIONS.IOS.LOCATION_ALWAYS || PERMISSIONS.IOS.LOCATION_WHEN_IN_USE :
                PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION).then(async (result) => {
                if ('granted' === result) {
                    await Geolocation.getCurrentPosition(
                        (position) => {
                            const currentLocation = position.coords;
                            this.setState({
                                currentLocation: currentLocation,
                                latitude: currentLocation.latitude,
                                longitude: currentLocation.longitude,
                                mocked:position.mocked
                            }, function () {
                                if (currentLocation.latitude === null && currentLocation.longitude === null) {
                                    this.state.GPSasked === true
                                        ?
                                        Alert.alert('', 'Your Location data is missing, Please clear cache in GOOGLE MAPS',
                                            [{
                                                text: 'GO BACK', onPress: () => {
                                                    this.props.navigation.goBack()
                                                }
                                            }])
                                        :
                                        Alert.alert('', 'Your Location data is missing, Please check your GPS  Settings',
                                            [
                                                {
                                                    text: 'ASK GPS', onPress: () => {
                                                        // this.checkGPSpermission();
                                                    }
                                                },
                                                {
                                                    text: 'GO BACK', onPress: () => {
                                                        this.props.navigation.goBack()
                                                    }
                                                }
                                            ]
                                        )
                                } else if (currentLocation.latitude && currentLocation.longitude && this.state.swipeActivated === true) {
                                    this.validatingLocation()
                                }
                            });
                        },
                        (error) => {
                            // console.log(error.code, error.message);
                            if (error.code === 2 && this.state.latitude === null && this.state.longitude === null) {
                                Alert.alert('', 'Your Location data is missing, Please check your GPS  Settings',
                                    [
                                        {
                                            text: 'ASK GPS', onPress: () => {
                                                // this.checkGPSpermission();
                                            }
                                        },
                                        {
                                            text: 'GO BACK', onPress: () => {
                                                this.props.navigation.goBack()
                                            }
                                        }
                                    ]
                                )
                            } else {
                                // console.log('GPS error ',error.code, error.message);
                                Utils.dialogBox(error.message, '')
                                this.props.navigation.goBack()
                            }
                        },
                        // {enableHighAccuracy: false, timeout: 10000, maximumAge: 100000}
                        {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
                    );
                } else {
                    Utils.dialogBox('Location permission denied', '');
                    this.setState({latitude: null, longitude: null})
                    this.props.navigation.goBack();
                }
            });
        }catch (err) {
            // console.log('location error before',err);
            this.setState({latitude: null, longitude: null})
        }
    }

    checkGPSpermission() {

    }


    validatingLocation() {
        Services.returnCurrentPosition((position)=>{
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const mocked = position.mocked;

        if (latitude && longitude) {
            let tempBody = {}
            tempBody.location = {"latitude": latitude, "longitude": longitude}
             if (this.state.swipeActivated) {
                if (this.state.summaryModalButton === 'ATTEMPTED'){
                    this.CancelOrder(tempBody)
                }else {
                    this.setState({
                        latitude, longitude, mocked
                    },()=>{
                        if (this.state.selectedButton === 'DELIVER'){
                            if (this.state.orderItems.length > 0) {
                                if (this.state.itemIds.length > 0) {
                                    this.endOrder()
                                } else {
                                    Utils.dialogBox('Please select the delivery items', '')
                                }
                            } else {
                                this.endOrder()
                            }
                        }else if (this.state.selectedButton === 'REJECT') {
                            if (this.state.orderItems.length > 0) {
                                if (this.state.itemIds.length > 0) {
                                    this.rejectOrderByCustomer()
                                } else {
                                    Utils.dialogBox('Please select atleast one item for rejection', '')
                                }
                            } else {
                                this.rejectOrderByCustomer()
                            }
                        }
                    })

                }
            }
        }else {
            // this.requestLocationPermission();
            Alert.alert('', 'Your Location data is missing,Please check your Location Settings',
                [{
                    text: 'enable', onPress: () => {
                        this.requestLocationPermission();
                    }
                }]);
        }
        })
    }

    //API CALL to send OTP to customer
    sendOTP(){
        const {orderData} = this.state;
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.SEND_OTP_TO_DELIVER + orderData.id;
        const body = {};
        self.setState({ spinnerBool: true}, () => {
            Services.AuthHTTPRequestForShiftFlow(apiURL, 'GET', body, function (response) {
                if (response) {
                    // console.log('send otp resp200',response.data);
                    var data = response.data;
                    self.setState({spinnerBool: false,otpDigits:''},()=>{
                        Utils.dialogBox(data.message, '');
                    });
                }
            },function (error) {
                self.errorHandling(error)
            });
        });
    }

    //API CALL to send OTP
    verifyOTP() {
        const {orderData} = this.state;
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.VERIFY_OTP_TO_DELIVER + orderData.id + '/' + self.state.otpDigits;
        const body = {}
        // console.log('verify OTP apiURL',apiURL,'body===>',body)
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequestForShiftFlow(apiURL, "GET", body, (response) => {
                if (response.status === 200) {
                    let responseData = response.data;
                    if(responseData.otpStatus){
                        self.setState({
                            spinnerBool: false,
                            otpVerificationModal: false,
                            satisfiedOTP:true
                        }, () => {
                            self.finalStepVerificationCycle()
                        })
                    }else {
                        self.setState({
                            spinnerBool: false,otpErrorMessage:responseData.message
                        })
                    }

                }
            }, (error) => {
                self.errorHandling(error)
            })
        });
    }

    //API CALL to END ORDER
    endOrder = () => {
        const self = this;
        let itemIds = this.state.orderItems.length > 0 ? this.state.itemIds : null;


        let tempIds = this.state.itemIds
        // console.log('api orderItems',orderItems);
        // console.log('api tempIds',tempIds);

        const {orderData,orderItems,latitude,longitude,mocked} =self.state;

        let tempList = []
        let finalList = []
        let tempValuesList = []
        let unSelectedCount = []

        let sampleList =[]
        // console.log('orderItems start',orderItems);

        for (let i = 0; i < orderItems.length; i++) {
            let sampleOrders = orderItems[i]
            if (orderItems[i].selectedItemId === true) {

                let tempData = orderItems[i]
                tempData.count = tempData.delivered
                finalList.push(tempData)


                sampleOrders.tempRejected = sampleOrders.rejected
                sampleOrders.tempDelivered = sampleOrders.delivered
                sampleList.push(sampleOrders)

                let tempCount =  tempData.delivered
                if (tempCount === 0 || tempCount === null ){
                    tempValuesList.push(tempCount)
                }
            }else {
                sampleOrders.tempRejected = sampleOrders.itemQuantity
                sampleOrders.tempDelivered = 0
                sampleList.push(sampleOrders)
                if (sampleOrders.delivered !== sampleOrders.itemQuantity){
                    unSelectedCount.push(sampleOrders.delivered)
                }
            }
            }


        // console.log('sampleList last',sampleList);
        let finalValuesList = tempValuesList.length
        let unSelectedLength = unSelectedCount.length

        // console.log('unSelectedLength',unSelectedLength,'unSelectedCount==',unSelectedCount);

        if (finalValuesList === 0) {
        if (unSelectedLength === 0) {

            if (this.state.orderItems.length > 0) {
                if (this.state.itemIds.length > 0) {
                    this.setState({showSummaryDetailsModal:!this.state.summaryDetailsConfirmed,finalList:sampleList,selectedButton:'DELIVER'})
                } else {
                    Utils.dialogBox('Please select the delivery items', '')
                }
            }else {
                this.setState({showSummaryDetailsModal:!this.state.summaryDetailsConfirmed,finalList:[],selectedButton:'DELIVER'})
            }


            let tempBody = {}
            tempBody.location = {latitude: latitude, longitude: longitude}
            tempBody.mocked = mocked
            tempBody.id = orderData.id
            tempBody.shiftId = this.state.shiftId
            tempBody.items = finalList;
            if (orderData.paymentType === 'COD'){
                tempBody.cashCollected = Math.ceil(this.state.cashCollected)
            }

            if (this.state.summaryDetailsConfirmed) {
                self.setState({endOrderRequestBody: tempBody}, () => {
                    self.finalStepVerificationCycle()
                })
            }

        }else {
            Utils.dialogBox('Un-checked Item count should not be edited', '')
        }
        }else {
            Utils.dialogBox('Selected Item Delivered count should not be 0', '')
        }
    };

    finalStepVerificationCycle(){
        const self = this;
        const {orderData,satisfiedOTP,satisfiedSignature} = self.state;

        if (orderData.requestForOTP && !satisfiedOTP) {
            let customerPhoneNumber = orderData.address ? orderData.address.telephone : '';
            self.setState({otpVerificationModal: true, otpDigits: '',customerPhoneNumber,satisfiedOTP:false})
        } else if (orderData.requestForSignature && !satisfiedSignature){
            self.setState({SignatureModal: true, signatureDragged: false,satisfiedSignature:false})
        }else {
            this.requestToDeliverOrder()
        }
    }

    requestToDeliverOrder(){
        const self = this;
            const apiURL = Config.routes.BASE_URL + Config.routes.END_ORDER;
            self.setState({spinnerBool: true}, () => {
                Services.AuthHTTPRequest(apiURL, "POST", self.state.endOrderRequestBody, function (response) {
                    if (response.status === 200) {
                        // console.log('delivery order resp200',response.data)
                        self.setState({spinnerBool: false},()=>{
                            self.uploadMultipleImages()
                        })
                    }
                }, function (error) {
                    self.setState({ swipeActivated: false, summaryDetailsConfirmed: false})
                    self.errorHandling(error);
                })
            });
    }

    //API call to reject orders
    requestToRejectOrder(){
        const self = this;
        const {rejectionRequestBody} =self.state;
        const apiURL = Config.routes.BASE_URL + Config.routes.REJECT_ORDER_BY_CUSTOMER;
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequestForShiftFlow(apiURL, "POST", rejectionRequestBody, function (response) {
                if (response.status === 200) {
                    // console.log('reject OrderBy Customer====', response.data);
                    self.setState({spinnerBool: false, swipeActivated: false, summaryDetailsConfirmed: false})
                    self.props.navigation.goBack()
                }
            }, function (error) {
                self.setState({ swipeActivated: false, summaryDetailsConfirmed: false})
                self.errorHandling(error);
            })
        });
    }

    rejectOrderByCustomer = () => {
        // if(this.state.itemIds.length > 0) {

        const self = this;
        const latitude = this.state.latitude;
        const longitude = this.state.longitude;
        let itemIds = this.state.orderItems.length > 0 ? this.state.itemIds : null;

        let tempIds = this.state.itemIds
        let orderItems = this.state.orderItems
        // console.log('reject orderItems',orderItems);
        // console.log('api tempIds',tempIds);
        let tempList = []
        let finalList = []
        let tempValuesList = []
        let finalValuesCheck = []
        let imageCountCheck = []
        let unSelectedCount = []

        let sampleList = []

        for (let i = 0; i < orderItems.length; i++) {
            let sampleOrders = orderItems[i]
                if (orderItems[i].selectedItemId === true) {
                    let tempData = orderItems[i]
                    tempData.count = tempData.delivered
                    finalList.push(tempData)


                    sampleOrders.tempRejected = orderItems[i].delivered
                    sampleOrders.tempDelivered = orderItems[i].rejected
                    sampleList.push(sampleOrders)

                    let tempCount =  tempData.delivered
                    if (tempCount === 0 || tempCount === null ){
                        finalValuesCheck.push(tempCount)
                    }
                    if (sampleOrders.rejected > 0){
                        imageCountCheck.push(sampleOrders.rejected)
                    }
                } else {
                    sampleOrders.tempRejected = 0
                    sampleOrders.tempDelivered = sampleOrders.itemQuantity
                    sampleList.push(sampleOrders)
                    if (sampleOrders.delivered !== sampleOrders.itemQuantity){
                        unSelectedCount.push(sampleOrders.delivered)
                    }
                    if (sampleOrders.delivered > 0){
                        imageCountCheck.push(sampleOrders.delivered)
                    }
                }
        }


        let finalImage = true
        if (imageCountCheck.length > 0){
            // finalImage = !!this.state.picUploaded;
            finalImage = !!this.state.deliveryImagesArray.length>0;
        }else {
            finalImage = true
        }

        let finalValuescheckLength = finalValuesCheck.length
        let unSelectedLength = unSelectedCount.length

        // console.log('unSelectedLength reject',unSelectedLength,'unSelectedCount==',unSelectedCount);


        let finalCash = 0;
        if (finalImage){
            let totalCash = this.state.orderData.payment.amount_ordered
            finalCash = totalCash- this.state.cashCollected
        }else {
            finalCash = 0;
        }



        // console.log('finalCash',finalCash);

        // console.log('rejected finalValuesList',finalValuesList,'tempValuesList===',tempValuesList);
        // console.log('rejected finalImage',finalImage);
        if (finalImage) {
            if (finalValuescheckLength === 0) {
            if (unSelectedLength === 0) {
                if (this.state.orderItems.length > 0) {
                    if (this.state.itemIds.length > 0) {
                        this.setState({
                            showSummaryDetailsModal: !this.state.summaryDetailsConfirmed,
                            finalList: sampleList,
                            selectedButton: 'REJECT'
                        })
                    } else {
                        Utils.dialogBox('Please select the rejected items', '')
                    }
                } else {
                    this.setState({
                        showSummaryDetailsModal: !this.state.summaryDetailsConfirmed,
                        finalList: [],
                        selectedButton: 'REJECT'
                    })
                }


                let tempBody = {}
                tempBody.location = {latitude: latitude, longitude: longitude}
                tempBody.mocked = this.state.mocked
                tempBody.id = this.state.orderData.id
                tempBody.cashCollected = finalCash
                tempBody.shiftId = this.state.shiftId
                tempBody.items = finalList;

                if (this.state.summaryDetailsConfirmed) {
                    self.setState({rejectionRequestBody:tempBody},()=>{
                        self.requestToRejectOrder()
                    })
                }
            } else {
                Utils.dialogBox('Un-checked Item count should not be edited', '')
            }
            } else {
                Utils.dialogBox('Selected Item Rejected count should not be 0', '')
            }
        }else {
            Utils.dialogBox('Please upload Image of delivered item','')
        }
    }


    //cashCollected validate
    CashCollectedValidate(cash) {
        cash = cash.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_='":*?<>{}]/g, '').replace(/\s+/g, '');

        if (cash > 3000000) {
            this.setState({cashCollected: '3000000'})
            Utils.dialogBox('Maximum Value is 300000', '');
        } else if (cash < 0) {
            this.setState({cashCollected: '0'})
            // Utils.dialogBox('Minimum Value is 0', '');
        } else {
            this.setState({cashCollected: cash}, () => {
                if (this.state.orderItems.length > 0) {
                    this.setState({paymentTypeValidation: true})
                } else {
                    if (this.state.cashCollected === JSON.stringify(this.state.orderData.payment.amount_ordered)) {
                        this.setState({paymentTypeValidation: true})
                    } else {
                        this.setState({paymentTypeValidation: false})
                    }
                }
            })
        }
    }

    //to upload DELIVERED ORDER PIC
    deliveredImageUpload(uploadType) {
        const self = this;
        Services.checkImageUploadPermissions(uploadType, (response) => {
            console.log('service image retunr', response);
            let imageData = response.image
            let formData = response.formData
            let userImageUrl = imageData.path

            let deliveryImagesArray = this.state.deliveryImagesArray;

            deliveryImagesArray.push(imageData);

            this.setState({deliveryImagesArray})

            // console.log('deliveryImagesArray list',deliveryImagesArray.length,deliveryImagesArray)

                    // let apiURL = Config.routes.BASE_URL + Config.routes.DELIVERED_IMAGE_UPLOAD + self.state.orderData.id;
                    // const body = formData;
                    // // console.log(' image upload url', apiURL, 'body===', body)
                    // this.setState({spinnerBool: true}, () => {
                    //     Services.AuthProfileHTTPRequest(apiURL, 'POST', body, function (response) {
                    //         if (response.status === 200) {
                    //             // console.log('image upload resp200',response)
                    //             self.setState({ImageData: image, spinnerBool: false, picUploaded: true, ImageFormData: formData,imageLoading:true})
                    //         }
                    //     }, function (error) {
                    //         self.errorHandling(error)
                    //     });
                    // });
        })
    };

    uploadMultipleImages(){
        const self = this;
        const {deliveryImagesArray} = self.state;

        let formData = new FormData();
        // if (deliveryImagesArray.length >= 2){
            for (var i = 0; i < deliveryImagesArray.length; i++) {
                let tempData = deliveryImagesArray[i]
                formData.append('data'+i, {
                    uri: tempData.path,
                    type: tempData.mime,
                    name: tempData.path
                });
            }
        // }
        let apiURL = Config.routes.BASE_URL + Config.routes.UPLOAD_DELIVERED_MULTIPLE_IMAGES + self.state.orderData.id;
        const body = formData;
        console.log(' image upload url', apiURL, 'body===', body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthProfileHTTPRequest(apiURL, 'POST', body, function (response) {
                if (response.status === 200) {
                    console.log('image upload resp200',response)
                    self.setState({spinnerBool: false, swipeActivated: false,summaryDetailsConfirmed:false})
                    self.props.navigation.goBack()
                }
            }, function (error) {
                self.errorHandling(error)
            });
        });
    }

    validateCancelShiftReason() {
        if (this.state.cancelReasonValue) {
            if (this.state.cancelReasonValue === '4') {
                if (this.state.otherReasontoCancel) {
                    this.setState({CancelShiftReason: this.state.otherReasontoCancel,summaryModalButton:'ATTEMPTED',swipeActivated:true},()=>{
                        this.validatingLocation()
                    })
                } else {
                    Utils.dialogBox('Please enter other Reason for Not Delivering the Order', '')
                }

            } else {
                this.setState({summaryModalButton:'ATTEMPTED',swipeActivated:true},()=>{
                    this.validatingLocation()
                })
            }
        } else {
            Utils.dialogBox('Please select the Reason for Not Delivering the Order', '')
        }
    }


    //API CALL to CANCEL ORDER
    CancelOrder(body) {
        const self = this;
        const orderId = self.state.orderData.id;
        const apiURL = Config.routes.BASE_URL + Config.routes.CANCEL_ORDER;
        body.id = self.state.orderData.id
        body.reason = self.state.CancelShiftReason
        body.status = self.state.orderStatus
        // console.log('Cancel Order apiURL====', apiURL,'body==',body);
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequestForShiftFlow(apiURL, "PUT", body, function (response) {
                if (response.status === 200) {
                    // console.log('Cancel Order rep200====', response.data);
                    self.setState({spinnerBool: false, swipeActivated: false})
                    self.props.navigation.goBack()
                }
            }, function (error) {
                // console.log(' Cancel Order eror', error)
                self.errorHandling(error);
            })
        });
    };

    //API CALL to Send Traking Link
    sendTrackingLink() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.SEND_TRACKING_LINK + '?shiftId='+self.state.shiftId+ '&orderId='+ self.state.orderData.id;
        const body ={};
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequestForShiftFlow(apiURL, "POST", body, function (response) {
                if (response.status === 200) {
                    // console.log('tracking link rep200====', response.data);
                    self.setState({spinnerBool: false, swipeActivated: false},()=>{
                        Alert.alert('Tracking Link has been sent to Mobile Number',Alert);
                    })
                }
            }, function (error) {
                self.errorHandling(error);
            })
        });
    };

    validateTotalCashCollected(itemId,selectedCount,price, totalCount, itemStatus, button) {
        const listOfItems = this.state.orderItems;
        const num = this.state.cashCollected;
        let tempTotal = []
        for (let i = 0; i < listOfItems.length; i++) {
            if (listOfItems[i].selectedItemId=== true){
                if (listOfItems[i].id===itemId) {
                }else {
                    let tempAmount = listOfItems[i].delivered * listOfItems[i].itemPricePerEach;
                    tempTotal.push(tempAmount);
                }
            }
        }

        let oldCash =tempTotal.reduce(function (a, b) {
            return a + b;
        }, 0)

        let calculatedAmount = selectedCount*price


        if (itemStatus === true) {
            // let temCashCollected = Math.ceil(oldCash + calculatedAmount)
            let temCashCollected = oldCash + calculatedAmount
           let finalCash = Math.round(temCashCollected)
            this.setState({cashCollected: JSON.stringify(finalCash)})
        } else {
            if (button === 'checkBox') {
                // const temCashCollected = Math.ceil(oldCash);
                let temCashCollected = oldCash
               let finalCash = Math.round(temCashCollected)
                this.setState({cashCollected: JSON.stringify(finalCash)})
            }
        }

        if (itemId && button === 'checkBox') {
            if (itemStatus === true) {
                for (let i = 0; i < listOfItems.length; i++) {
                    if (itemStatus === listOfItems[i].selectedItemId && itemId === listOfItems[i].id) {
                        this.state.itemIds.push(itemId);
                    }
                }
            } else {
                    this.state.itemIds.pop(itemId);
            }
        }

        if (this.state.itemIds.length === this.state.orderItems.length) {
            Utils.dialogBox('Please cancel the Order')
        }

    }

    validateCount(item, index) {
        return (
            <View style={[Styles.row,Styles.alignCenter]}>
                <TouchableOpacity
                    style={[Styles.aslCenter]}
                    disabled={ !item.selectedItemId ||  item.remainingQuantity === item.rejected}
                    onPress={() => this.operatorValidation(item, index, 'DECREMENT')}
                >
                    <Text style={[Styles.IncrementButton, !item.selectedItemId || item.remainingQuantity === item.rejected ?Styles.bcAsh:Styles.bcBlk,
                        !item.selectedItemId || item.remainingQuantity === item.rejected ?Styles.cAsh:Styles.cBlk]}>-</Text></TouchableOpacity>
                <Text style={[Styles.txtAlignCen, Styles.ffMbold, Styles.f14, {width: 35}]}>{item.delivered}</Text>
                <TouchableOpacity style={[Styles.aslCenter,]}
                                  disabled={!item.selectedItemId || item.delivered === item.remainingQuantity}
                                  onPress={() => this.operatorValidation(item, index, 'INCREMENT')}>
                    <Text style={[Styles.IncrementButton,!item.selectedItemId || item.delivered === item.remainingQuantity ?Styles.bcAsh:Styles.bcBlk,
                        !item.selectedItemId ||  item.delivered === item.remainingQuantity ?Styles.cAsh:Styles.cBlk]}>+</Text></TouchableOpacity>
            </View>
        )
    }

    operatorValidation(item, index, operator) {
        if (operator === 'DECREMENT') {
            let value = Math.trunc(parseInt(item.delivered));
            if (item.count === '') {
                Utils.dialogBox('Please enter a value', '');
            } else {
                let value = Math.trunc(parseInt(item.delivered));
                if (value < 1) {
                    Utils.dialogBox('Minimum value is 0', '');
                } else {
                    let tempCount = (Math.trunc(Number(item.delivered) - 1));
                    let orderItems = [...this.state.orderItems]
                    orderItems[index] = {
                        ...orderItems[index],
                        delivered: tempCount,
                        rejected:item.rejected + 1
                    }
                    this.setState({orderItems})
                    this.validateTotalCashCollected(item.id, tempCount,item.itemPricePerEach,item.delivered, item.selectedItemId, 'decrement')
                }
            }
        } else if (operator === 'INCREMENT') {
            let value = Math.trunc(parseInt(item.delivered));
            let TargetValue = Math.trunc(parseInt(item.remainingQuantity));
            if (value > TargetValue) {
                Utils.dialogBox('Maximum value is ' + TargetValue, '');
            } else {
                let tempCount = (Math.trunc(Number(item.delivered) + 1));
                let orderItems = [...this.state.orderItems]
                orderItems[index] = {
                    ...orderItems[index],
                    delivered: tempCount,
                    rejected:item.rejected-1
                }
                this.setState({orderItems})
                this.validateTotalCashCollected(item.id,tempCount, item.itemPricePerEach,item.delivered, item.selectedItemId, 'increment')
            }

        }
    }


    saveSign() {
        this.refs["sign"].saveImage();
    }


    resetSign() {
        this.refs["sign"].resetImage();
        this.setState({signatureDragged: false})
    }

    _onSaveEvent(result) {
        if (this.state.signatureDragged) {
            //result.encoded - for the base64 encoded png
            //result.pathName - for the file path name
            // this.UploadSignature(result)
            console.log('sign result event',result)
        } else {
            Utils.dialogBox('Please Sign above', '')
        }
    }

    _onDragEvent() {
        // This callback will be called when the user enters signature
        // this.setState({signatureDragged: true})
        console.log('dragged true')
    }

    //Upload Signature
    UploadSignature(result) {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.CUSTOMER_DIGITAL_SIGNATURE + self.state.orderData.id;
        const body = {
            imageValue: result.encoded
        }
        console.log('signature',apiURL,body,result);
        this.setState({spinnerBool: true}, () => {
            Services.AuthSignatureHTTPRequest(apiURL, 'POST', body, function (response) {
                if (response) {
                    self.setState({
                        spinnerBool: false,
                        SignatureModal: false,
                        signatureDragged: false,
                        satisfiedSignature:true
                    }, () => {
                        Utils.dialogBox("Signature captured successfully", '',)
                        self.finalStepVerificationCycle()
                    })
                }
            }, function (error) {
                self.errorHandling(error)
            });
        });
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

    render() {
        const {orderData,showDeliveryAddress,showPickUpAddress,deliveryImagesArray} = this.state;
        return (
            <View style={[[Styles.flex1, Styles.bgDWhite]]}>
                {this.renderSpinner()}
                <OfflineNotice/>
                {
                    orderData
                        ?
                        <View style={[[Styles.flex1, Styles.bgDWhite]]}>

                            <View style={[Styles.bgDarkRed, Styles.AuthScreenHeadershadow]}>
                                <Appbar.Header style={Styles.bgDarkRed}>
                                    <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                                    <Appbar.Content
                                        title={(orderData.siteCode ? orderData.siteCode + ' - ': '') + this.state.orderData.orderId}
                                        titleStyle={[Styles.ffMbold]}/>
                                </Appbar.Header>
                            </View>

                            {
                                orderData
                                    ?
                                    <ScrollView
                                        persistentScrollbar={true}
                                        style={[Styles.flex1, Styles.bgDWhite, Styles.padH5]}>

                                        <View style={[Styles.p5]}>
                                            <View style={[Styles.row, Styles.jSpaceBet]}>
                                                <Text style={[Styles.f16, Styles.ffMbold,]}>Order Details
                                                    : {orderData.itemQuantity} Items</Text>
                                                <MaterialIcons
                                                    name={this.state.showOrderItemsList ? 'expand-less' : 'expand-more'}
                                                    color='#000' size={30}
                                                    onPress={() => {
                                                        this.setState({showOrderItemsList: !this.state.showOrderItemsList})
                                                    }}/>
                                            </View>

                                            {
                                                this.state.orderItems && this.state.showOrderItemsList
                                                    ?
                                                    <View style={{flex: 1, alignItems: 'center'}}>
                                                        <Row size={12} nowrap
                                                             style={[Styles.row, Styles.padV10, Styles.alignCenter, Styles.bgOrangeYellow]}>
                                                            <Col sm={4.5}>
                                                                <Text
                                                                    style={[Styles.ffMbold, Styles.f16, Styles.aslCenter]}>Item</Text>
                                                            </Col>
                                                            <Col sm={2}>
                                                                <Text
                                                                    style={[Styles.ffMbold, Styles.f16, Styles.aslCenter]}>Price(<FontAwesome
                                                                    name="inr" size={14} color="#000"/>)</Text>
                                                            </Col>
                                                            <Col sm={3.5}>
                                                                <Text
                                                                    style={[Styles.ffMbold, Styles.f16, Styles.aslCenter]}>Count</Text>
                                                            </Col>
                                                            <Col sm={2}>
                                                                <Text style={[Styles.ffMbold, Styles.f16]}/>
                                                            </Col>
                                                        </Row>
                                                        <View style={[Styles.row, Styles.aslCenter, Styles.flex1]}>
                                                            {
                                                                this.state.orderItems.length > 0 ?
                                                                    <FlatList
                                                                        data={this.state.orderItems}
                                                                        renderItem={({item, index}) => (

                                                                            <Row size={12} nowrap
                                                                                 style={[Styles.row, Styles.p5, Styles.aslCenter, {
                                                                                     // backgroundColor: ((index % 2) === 0 ? '#f5f5f5' : '#fff')
                                                                                     backgroundColor: ((index % 2) === 0 ? '#ccf6d8' : '#e4b7d4')
                                                                                 }
                                                                                 ]}>
                                                                                <Col sm={4.5}>
                                                                                    <Text
                                                                                        style={[Styles.ffMregular, Styles.f14, {textAlignVertical: 'center'}]}>{_.startCase(item.name) || '---'}</Text>
                                                                                </Col>
                                                                                <Col sm={2}>
                                                                                    <Text
                                                                                        style={[Styles.ffMbold, Styles.f14, Styles.aslCenter]}>{item.price}({item.itemQuantity})</Text>
                                                                                </Col>
                                                                                <Col sm={3.5}>
                                                                                    {
                                                                                        item.status === 'DELIVERED' || item.status === 'REJECTED' || item.status === "REJECTED_BY_DA"
                                                                                            ?
                                                                                            <Text
                                                                                                style={[Styles.ffMregular, Styles.f14, Styles.aslCenter]}>{item.delivered}</Text>
                                                                                            :
                                                                                            item.status == null || item.remainingQuantity !== 0
                                                                                                ?
                                                                                                this.validateCount(item, index)
                                                                                                :
                                                                                                <Text
                                                                                                    style={[Styles.ffMregular, Styles.f14, Styles.aslCenter]}>{item.delivered}</Text>
                                                                                    }
                                                                                </Col>
                                                                                <Col sm={2}>
                                                                                    <View>
                                                                                        {item.status === 'DELIVERED' || item.status === 'REJECTED' || item.status === "REJECTED_BY_DA"
                                                                                            ?
                                                                                            null
                                                                                            :
                                                                                            item.status === null || item.remainingQuantity !== 0
                                                                                                ?
                                                                                                <View>
                                                                                                    <Checkbox
                                                                                                        color={'#000'}
                                                                                                        size={25}
                                                                                                        onPress={() => {
                                                                                                            let orderItems = [...this.state.orderItems]
                                                                                                            orderItems[index] = {
                                                                                                                ...orderItems[index],
                                                                                                                selectedItemId: !item.selectedItemId,
                                                                                                                delivered: item.itemQuantity,
                                                                                                                rejected: 0
                                                                                                            }
                                                                                                            this.setState({orderItems}, () => {
                                                                                                                let tempAmount = item.count * item.itemPricePerEach;
                                                                                                                let tempCount = item.delivered
                                                                                                                this.validateTotalCashCollected(item.id, tempCount, item.itemPricePerEach, item.count, !item.selectedItemId, 'checkBox')
                                                                                                            })
                                                                                                        }}
                                                                                                        status={item.selectedItemId ? 'checked' : 'unchecked'}
                                                                                                    />
                                                                                                </View>
                                                                                                : null
                                                                                        }
                                                                                        {
                                                                                            item.status
                                                                                                ?
                                                                                                <Text
                                                                                                    style={[Styles.ffMregular,
                                                                                                        item.status === 'DELIVERED' || item.status === "PARTIALLY_DELIVERED" ? Styles.colorGreen :
                                                                                                            item.status === 'ATTEMPTED' ? [Styles.f12, Styles.cBlueGreenMix] :
                                                                                                                item.status === 'REJECTED' || item.status === 'REJECTED_BY_DA' || item.status === 'REJECTED_BY_CUSTOMER' || item.status === 'CANCELLED' ? Styles.cRed : Styles.cBlk]}>{Services.getOrderItemStatus(item.status)}</Text>
                                                                                                :
                                                                                                null
                                                                                        }
                                                                                    </View>
                                                                                </Col>
                                                                            </Row>
                                                                        )}
                                                                        keyExtractor={(item, index) => index.toString()}
                                                                    />
                                                                    :
                                                                    <Text
                                                                        style={[Styles.cBlk, Styles.f20, Styles.aslCenter, Styles.ffMregular]}>
                                                                        No Items in the list.</Text>
                                                            }
                                                        </View>
                                                    </View>

                                                    :
                                                    null
                                            }

                                            <View style={{borderBottomWidth: 1, paddingVertical: 10}}/>
                                        </View>

                                        {
                                            orderData.showTrackingLink
                                                ?
                                                <View style={[Styles.row, Styles.jEnd, Styles.marV5, Styles.padH10]}>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            this.sendTrackingLink()
                                                        }}
                                                        activeOpacity={0.7}
                                                        style={[Styles.row, Styles.bgLYellow, Styles.br5, Styles.aslCenter, Styles.p5, {width: Dimensions.get('window').width / 2.3}]}>
                                                        {LoadSVG.emailGreenSmall}
                                                        <Text
                                                            style={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>{'  '}Send
                                                            Tracking Link</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                :
                                                null
                                        }


                                        {
                                            orderData.address
                                                ?
                                                <View style={[Styles.padH10,Styles.padV5, Styles.flex1]}>

                                                    {/*/!*PICKUP*!/*/}
                                                    {/*{*/}
                                                    {/*    orderData.pickUpAddress*/}
                                                    {/*        ?*/}
                                                    {/*        <View*/}
                                                    {/*            style={[Styles.bgWhite, Styles.OrdersScreenCardshadow, Styles.padH10, Styles.padV5]}>*/}
                                                    {/*            <View style={[Styles.row,Styles.jSpaceBet]}>*/}
                                                    {/*                <View style={[Styles.row]}>*/}
                                                    {/*                    <Text*/}
                                                    {/*                        style={[Styles.ffMextrabold, Styles.alignCenter, Styles.f16, Styles.padV3, Styles.cBlk]}>Pick-up*/}
                                                    {/*                        Address:</Text>*/}
                                                    {/*                    <MaterialCommunityIcons name={showPickUpAddress?"chevron-up-circle" : "chevron-down-circle"}*/}
                                                    {/*                                            size={24}*/}
                                                    {/*                                            style={[Styles.alignCenter,Styles.marH10,Styles.marV3]}*/}
                                                    {/*                                            onPress={()=>{this.setState({showPickUpAddress:!showPickUpAddress})}}/>*/}
                                                    {/*                </View>*/}
                                                    {/*                {*/}
                                                    {/*                    !showPickUpAddress*/}
                                                    {/*                        ?*/}
                                                    {/*                        Services.returnRouteNavigation(orderData.pickUpAddress.location, 'pickUp')*/}
                                                    {/*                        :*/}
                                                    {/*                        null*/}
                                                    {/*                }*/}
                                                    {/*            </View>*/}
                                                    {/*            <View*/}
                                                    {/*                style={[Styles.bgWhite, Styles.OrdersScreenCardshadow, Styles.padH10, Styles.padV5,Styles.marV10]}>*/}
                                                    {/*                <Text*/}
                                                    {/*                    style={[Styles.ffMextrabold, Styles.alignCenter, Styles.f16, Styles.cBlk]}>Customer*/}
                                                    {/*                    Contact:</Text>*/}
                                                    {/*                <View style={[Styles.row, Styles.jSpaceBet]}>*/}
                                                    {/*                    <Text*/}
                                                    {/*                        style={[Styles.aslCenter, Styles.f16, Styles.ffMregular]}>{orderData.pickUpAddress.firstname}{' '}{orderData.pickUpAddress.lastname}</Text>*/}
                                                    {/*                    <MaterialIcons name="phone" size={25} color="black"*/}
                                                    {/*                                   style={[Styles.aslCenter, Styles.p5]}*/}
                                                    {/*                                   onPress={() => {*/}
                                                    {/*                                       Linking.openURL(`tel:${orderData.pickUpAddress.telephone}`)*/}
                                                    {/*                                   }}/>*/}
                                                    {/*                </View>*/}
                                                    {/*            </View>*/}
                                                    {/*            {*/}
                                                    {/*                showPickUpAddress*/}
                                                    {/*                    ?*/}
                                                    {/*                    Services.returnNavigationAddressShowCard(orderData.pickUpAddress,'pickUp')*/}
                                                    {/*                    :*/}
                                                    {/*                    null*/}
                                                    {/*            }*/}
                                                    {/*        </View>*/}
                                                    {/*        :*/}
                                                    {/*        null*/}
                                                    {/*}*/}
                                                    {/*DELIVERED*/}
                                                    <View
                                                        style={[Styles.bgWhite, Styles.OrdersScreenCardshadow, Styles.padH10, Styles.padV5, Styles.mTop10]}>
                                                        <View style={[Styles.row,Styles.jSpaceBet]}>
                                                            <View style={[Styles.row]}>
                                                                <Text
                                                                    style={[Styles.ffMextrabold, Styles.alignCenter, Styles.f16, Styles.padV3, Styles.cBlk]}>Delivery
                                                                    Address:</Text>
                                                                <Ionicons name={showDeliveryAddress?"chevron-up-circle" : "chevron-down-circle"}
                                                                                        size={24}
                                                                                        style={[Styles.alignCenter,Styles.marH10,Styles.marV3]}
                                                                                        onPress={()=>{this.setState({showDeliveryAddress:!showDeliveryAddress})}}/>
                                                            </View>
                                                            {
                                                                !showDeliveryAddress
                                                                    ?
                                                                    Services.returnRouteNavigation(orderData.address.location, 'delivery')
                                                                    :
                                                                    null
                                                            }
                                                        </View>
                                                        <View
                                                            style={[Styles.bgWhite, Styles.OrdersScreenCardshadow, Styles.padH10, Styles.padV5,Styles.marV10]}>
                                                            <Text
                                                                style={[Styles.ffMextrabold, Styles.alignCenter, Styles.f16, Styles.cBlk]}>Customer
                                                                Contact:</Text>
                                                            <View style={[Styles.row, Styles.jSpaceBet]}>
                                                                <Text
                                                                    style={[Styles.aslCenter, Styles.f16, Styles.ffMregular]}>{orderData.address.firstname}{' '}{orderData.address.lastname}</Text>
                                                                <MaterialIcons name="phone" size={25} color="black"
                                                                               style={[Styles.aslCenter, Styles.p5]}
                                                                               onPress={() => {
                                                                                   Linking.openURL(`tel:${orderData.address.telephone}`)
                                                                               }}/>
                                                            </View>
                                                        </View>
                                                        {
                                                            showDeliveryAddress
                                                                ?
                                                                Services.returnNavigationAddressShowCard(orderData.address,'delivery')
                                                                :
                                                                null
                                                        }
                                                    </View>

                                                    <View
                                                        style={[Styles.bgWhite, Styles.OrdersScreenCardshadow, Styles.padH10, Styles.mTop10]}>
                                                        <View style={[Styles.padV5, Styles.mTop5]}>
                                                            <Text style={[Styles.ffMbold, Styles.f16]}>ETA,</Text>
                                                            <Text
                                                                style={[Styles.ffMregular, Styles.f16]}>{orderData.estimatedTimeOfArrival ? orderData.estimatedTimeOfArrival : '--'}</Text>
                                                        </View>

                                                        {/*Cash Collected */}
                                                        <View style={[Styles.marV5]}>
                                                            <View style={[Styles.padV5, Styles.flexWrap]}>
                                                                <Text style={[Styles.ffMbold, Styles.f16]}>Order
                                                                    Amount: <FontAwesome name="inr" size={16}
                                                                                         color="#000"
                                                                                         style={[Styles.aslCenter]}/> {orderData.payment.amount_ordered} ({orderData.paymentType === "COD" ? 'Cash on Delivery' : 'Prepaid'})
                                                                </Text>
                                                            </View>

                                                            {
                                                                // this.state.orderData.status === "ATTEMPTED" ||
                                                                orderData.status === 'REJECTED_BY_CUSTOMER' || orderData.status === 'DELIVERED' || orderData.status === 'REJECTED'
                                                                || orderData.status === 'REJECTED_BY_DA' || orderData.status === 'CANCELLED' || orderData.status === "PARTIALLY_DELIVERED"
                                                                    ?
                                                                    null
                                                                    :
                                                                    orderData.paymentType === "COD"
                                                                        ?
                                                                        <View style={[Styles.row,]}>
                                                                            <View
                                                                                style={[Styles.row, {
                                                                                    // width: 85,
                                                                                    borderBottomWidth: 1,
                                                                                    borderBottomColor: '#000',
                                                                                }]}>
                                                                                <FontAwesome name="inr" size={23}
                                                                                             color="#000"
                                                                                             style={[Styles.aslCenter]}/>
                                                                                <TextInput
                                                                                    style={[Styles.aslCenter, Styles.ffMregular, Styles.f18]}
                                                                                    selectionColor={"black"}
                                                                                    placeholder={'enter collected amount  '}
                                                                                    keyboardType='numeric'
                                                                                    onChangeText={(cashCollected) => {
                                                                                        this.CashCollectedValidate(cashCollected)
                                                                                    }}
                                                                                    value={this.state.cashCollected}
                                                                                    // writingDirection={'rtl'}
                                                                                />
                                                                            </View>
                                                                        </View>
                                                                        :
                                                                        null
                                                            }

                                                        </View>

                                                    </View>


                                                </View>
                                                :
                                                null
                                        }
                                        {
                                            orderData.status
                                            ?
                                            // this.state.orderData.status === "ATTEMPTED" ||
                                            orderData.status=== 'REJECTED_BY_CUSTOMER'
                                            || orderData.status === 'DELIVERED' || orderData.status === 'REJECTED'
                                            || orderData.status === 'REJECTED_BY_DA' || orderData.status === 'CANCELLED'
                                            || orderData.status === "PARTIALLY_DELIVERED"
                                                ?
                                                null
                                                :
                                                <View>
                                                    {
                                                        this.state.picUploaded
                                                            ?
                                                            <View>
                                                                <View
                                                                    style={[Styles.row, Styles.aitCenter, Styles.marV5, Styles.padH10]}>
                                                                    <View
                                                                        style={[Styles.row, Styles.bgDullYellow, Styles.br5, Styles.aslCenter, Styles.p5, {width: Dimensions.get('window').width / 1.6}]}>
                                                                        {LoadSVG.cameraPic}
                                                                        <Text
                                                                            style={[Styles.f16, Styles.cDisabled, Styles.ffMregular]}>Upload
                                                                            Delivered Item Pic</Text>
                                                                    </View>

                                                                    <TouchableOpacity
                                                                        onPress={() => {
                                                                            this.setState({
                                                                                picUploaded: false,
                                                                                ImageData: ''
                                                                            })
                                                                        }}
                                                                        style={[Styles.bw1, Styles.br5, Styles.aslCenter, Styles.bgBlk, Styles.mLt10]}>
                                                                        <Text
                                                                            style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMextrabold, Styles.cWhite]}>Delete</Text>
                                                                    </TouchableOpacity>
                                                                </View>

                                                                <View style={[Styles.row, Styles.p5, Styles.aslCenter]}>

                                                                    <View
                                                                        style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 80,}]}>
                                                                        <TouchableOpacity
                                                                            style={[Styles.row, Styles.aslCenter]}
                                                                            onPress={() => {
                                                                                this.setState({
                                                                                    imagePreview: true,
                                                                                    imagePreviewURL: this.state.ImageData.path ? this.state.ImageData.path : ''
                                                                                })
                                                                            }}>
                                                                            <Image
                                                                                onLoadStart={() => this.setState({imageLoading: true})}
                                                                                onLoadEnd={() => this.setState({imageLoading: false})}
                                                                                style={[{
                                                                                    width: Dimensions.get('window').width / 2,
                                                                                    height: 120
                                                                                }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                source={this.state.ImageData.path ? {uri: this.state.ImageData.path} : null}
                                                                            />
                                                                            <MaterialIcons name="zoom-in" size={24} color="black"/>
                                                                        </TouchableOpacity>
                                                                        <ActivityIndicator
                                                                            style={[Styles.ImageUploadActivityIndicator]}
                                                                            animating={this.state.imageLoading}
                                                                        />
                                                                    </View>

                                                                </View>
                                                            </View>
                                                            :
                                                            <TouchableOpacity onPress={() => {
                                                                this.setState({imageSelectionModal: true})
                                                            }}
                                                                              style={[Styles.aslStart, Styles.marV5, Styles.marH10]}>
                                                                <View
                                                                    style={[Styles.row, Styles.bgDullYellow, Styles.br5, Styles.aslCenter, Styles.p5, {width: Dimensions.get('window').width / 1.8}]}>
                                                                    {LoadSVG.cameraPic}
                                                                    <Text
                                                                        style={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>Upload Proof of Delivery</Text>
                                                                </View>
                                                            </TouchableOpacity>
                                                    }

                                                    {
                                                        deliveryImagesArray.length > 0
                                                        ?
                                                            deliveryImagesArray.map((ImageData,index)=>{
                                                                return(
                                                                    <View>
                                                                        <View
                                                                            style={[Styles.row, Styles.aitCenter, Styles.marV5, Styles.padH10]}>
                                                                            <View
                                                                                style={[Styles.row, Styles.bgDullYellow, Styles.br5, Styles.aslCenter, Styles.p5, {width: Dimensions.get('window').width / 1.6}]}>
                                                                                {LoadSVG.cameraPic}
                                                                                <Text
                                                                                    style={[Styles.f16, Styles.cBlack87, Styles.ffMregular]}>Proof of Delivery Pic {'('+(index+1)+'/'+deliveryImagesArray.length+')'}</Text>
                                                                            </View>

                                                                            <TouchableOpacity
                                                                                onPress={() => {
                                                                                    let totalImages = deliveryImagesArray
                                                                                    let tempImages = totalImages.splice(index,1)
                                                                                    this.setState({
                                                                                        deliveryImagesArray:totalImages
                                                                                    })
                                                                                }}
                                                                                style={[Styles.bw1, Styles.br5, Styles.aslCenter, Styles.bgBlk, Styles.mLt10]}>
                                                                                <Text
                                                                                    style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMextrabold, Styles.cWhite]}>Delete</Text>
                                                                            </TouchableOpacity>
                                                                        </View>
                                                                        <View style={[Styles.row, Styles.p5, Styles.aslCenter]}>
                                                                            <View
                                                                                style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 80,}]}>
                                                                                <TouchableOpacity
                                                                                    style={[Styles.row, Styles.aslCenter]}
                                                                                    onPress={() => {
                                                                                        this.setState({
                                                                                            imagePreview: true,
                                                                                            imagePreviewURL: ImageData.path ? ImageData.path : ''
                                                                                        })
                                                                                    }}>
                                                                                    <Image
                                                                                        onLoadStart={() => this.setState({imageLoading: true})}
                                                                                        onLoadEnd={() => this.setState({imageLoading: false})}
                                                                                        style={[{
                                                                                            width: Dimensions.get('window').width / 2,
                                                                                            height: 120
                                                                                        }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                        source={ImageData.path ? {uri:ImageData.path} : null}
                                                                                    />
                                                                                    <MaterialIcons name="zoom-in" size={24} color="black"/>
                                                                                </TouchableOpacity>
                                                                                <ActivityIndicator
                                                                                    style={[Styles.ImageUploadActivityIndicator]}
                                                                                    animating={this.state.imageLoading}
                                                                                />
                                                                            </View>
                                                                        </View>
                                                                    </View>
                                                                )
                                                            })
                                                            :
                                                            null
                                                    }




                                                    {/* FOOTER BUTTON*/}
                                                    <View style={[Styles.row, Styles.jSpaceArd, Styles.marV15]}>
                                                        <TouchableOpacity
                                                            activeOpacity={0.7}
                                                            style={[Styles.padH5, Styles.bgRed, Styles.width120]}
                                                            onPress={() => {
                                                                if (this.state.orderItems.length > 0) {
                                                                    if (this.state.itemIds.length > 0) {
                                                                        this.setState({
                                                                            selectedButton: 'REJECT',
                                                                            swipeActivated: true
                                                                        }, () => {
                                                                            this.validatingLocation()
                                                                        })
                                                                    } else {
                                                                        Utils.dialogBox('Please select at least one item to Reject', '')
                                                                    }
                                                                } else {
                                                                    this.setState({
                                                                        selectedButton: 'REJECT',
                                                                        swipeActivated: true
                                                                    }, () => {
                                                                        this.validatingLocation()
                                                                    })
                                                                }
                                                            }}>
                                                            <Text
                                                                style={[Styles.f18, Styles.ffMbold, Styles.cWhite, Styles.padH10, Styles.padV10, Styles.aslCenter]}>Reject</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            activeOpacity={0.7}
                                                            style={[Styles.padH5, Styles.bgGrn, Styles.width120]}
                                                            onPress={() => {
                                                                this.setState({swipeActivated: true}, () => {
                                                                    if (this.state.orderItems.length > 0) {
                                                                        if (this.state.itemIds.length > 0) {
                                                                            if (this.state.cashCollected) {
                                                                                // if (this.state.picUploaded === true) {
                                                                                if (deliveryImagesArray.length > 0) {
                                                                                    this.setState({
                                                                                        selectedButton: 'DELIVER',
                                                                                        swipeActivated: true
                                                                                    }, () => {
                                                                                                  this.validatingLocation()
                                                                                    })
                                                                                } else {
                                                                                    Utils.dialogBox('Please upload Proof of Delivery Image', '')
                                                                                }
                                                                            } else {
                                                                                Utils.dialogBox('Please enter cash collected', '')
                                                                            }
                                                                        } else {
                                                                            Utils.dialogBox('Please select the delivery items', '')
                                                                        }
                                                                    } else {
                                                                        if (this.state.cashCollected) {
                                                                            if (this.state.cashCollected === JSON.stringify(this.state.orderData.payment.amount_ordered)) {
                                                                                // if (this.state.picUploaded === true) {
                                                                                    if (deliveryImagesArray.length > 0) {
                                                                                    this.setState({
                                                                                        selectedButton: 'DELIVER',
                                                                                        swipeActivated: true
                                                                                    }, () => {
                                                                                        this.validatingLocation()
                                                                                    })
                                                                                } else {
                                                                                    Utils.dialogBox('Please upload picture', '')
                                                                                }
                                                                            } else {
                                                                                Utils.dialogBox('Please enter valid cash collected', '')
                                                                            }
                                                                        } else {
                                                                            Utils.dialogBox('Please enter cash collected', '')
                                                                        }
                                                                    }
                                                                })
                                                            }}
                                                        >
                                                            <Text
                                                                style={[Styles.f18, Styles.ffMbold, Styles.cWhite, Styles.padH10, Styles.padV10, Styles.aslCenter]}>Deliver</Text>
                                                        </TouchableOpacity>
                                                    </View>

                                                    {/*ATTEMPT REASON*/}
                                                    {
                                                        orderData.status === "ATTEMPTED"
                                                            ? null
                                                            :
                                                            <View
                                                                style={[Styles.OrdersScreenCardshadow, Styles.bgWhite, Styles.m5]}>
                                                                <Text
                                                                    style={[Styles.ffMbold, Styles.cBlk, Styles.padH10, Styles.f18]}>If
                                                                    not
                                                                    delivered, select the reason</Text>
                                                                {this.state.OrderNotDeliveredReasonsList.map(item => {
                                                                    return (
                                                                        <View key={item.value}>
                                                                            {/*<RadioButton.Group*/}
                                                                            {/*    style={[Styles.row, Styles.aslCenter]}*/}
                                                                            {/*    onValueChange={cancelReasonValue => this.setState({*/}
                                                                            {/*        cancelReasonValue,*/}
                                                                            {/*        CancelShiftReason: item.reason,*/}
                                                                            {/*        orderStatus: item.status,*/}
                                                                            {/*        otherReasontoCancel: ''*/}
                                                                            {/*    })}*/}
                                                                            {/*    value={this.state.cancelReasonValue}*/}
                                                                            {/*>*/}
                                                                                <View style={[Styles.row]}>
                                                                                    <RadioButton.Android
                                                                                        style={[{paddingTop: 2}]}
                                                                                        value={item.value}
                                                                                        color='green'
                                                                                        status={this.state.cancelReasonValue === item.value?'checked' : 'unchecked'}
                                                                                        onPress={()=>{this.setState({
                                                                                            cancelReasonValue:item.value,
                                                                                            CancelShiftReason: item.reason,
                                                                                            orderStatus: item.status,
                                                                                            otherReasontoCancel: ''
                                                                                        })}}/>
                                                                                    <Text
                                                                                        style={[Styles.aslCenter, Styles.ffMregular, Styles.f16,]}>{item.reason}</Text>
                                                                                </View>
                                                                            {/*</RadioButton.Group>*/}
                                                                        </View>
                                                                    );
                                                                })}
                                                                {
                                                                    this.state.cancelReasonValue === '4'
                                                                        ?
                                                                        <View style={[Styles.p10]}>
                                                                            <Text
                                                                                style={[Styles.ffMregular, Styles.cBlk, Styles.padH10, Styles.f18]}>Add
                                                                                a note</Text>
                                                                            <TextInput
                                                                                placeholder={'comments'}
                                                                                style={[Styles.ffMregular, Styles.f18, Styles.padH10, Styles.brdrBtm1]}
                                                                                selectionColor={"black"}
                                                                                onChangeText={otherReasontoCancel => this.setState({otherReasontoCancel})}
                                                                                value={this.state.otherReasontoCancel}
                                                                                // writingDirection={'rtl'}
                                                                            />
                                                                        </View>
                                                                        :
                                                                        null
                                                                }
                                                                <View
                                                                    style={[Styles.row, Styles.jSpaceArd, Styles.p10, Styles.mBtm10]}>
                                                                    <TouchableOpacity
                                                                        activeOpacity={0.7}
                                                                        onPress={() => this.setState({cancelReasonValue: ''})}
                                                                        style={[Styles.aslCenter, Styles.br5, {backgroundColor: '#e3e3e3'}, Styles.width120]}>
                                                                        <Text
                                                                            style={[Styles.ffMbold, Styles.aslCenter, Styles.padH10, Styles.padV10, Styles.f18,]}>Cancel</Text>
                                                                    </TouchableOpacity>
                                                                    <TouchableOpacity
                                                                        disabled={!this.state.cancelReasonValue}
                                                                        onPress={() => this.validateCancelShiftReason()}
                                                                        style={[Styles.aslCenter, Styles.br5, {backgroundColor: !this.state.cancelReasonValue ? '#cccccc' : '#db99ff'}, Styles.width120]}>
                                                                        <Text
                                                                            style={[Styles.ffMbold, Styles.cWhite, Styles.aslCenter, Styles.padH10, Styles.padV10, Styles.f18,]}>Submit</Text>
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </View>
                                                    }

                                                </View>
                                                :
                                                null
                                        }
                                    </ScrollView>
                                    :
                                    null
                            }


                        </View>
                        :
                        <CSpinner/>
                }

                {/*MODALS START*/}

                {/*MODAL FOR OTP verification*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='fade'
                    visible={this.state.otpVerificationModal}
                    onRequestClose={() => {
                        // this.setState({otpVerificationModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                        <View
                            style={[Styles.bgWhite, Styles.aslCenter, Styles.br5,Styles.p5, {width: Dimensions.get('window').width - 40}]}>
                            <Text style={[Styles.colorBlue, Styles.f25, Styles.ffLBold, Styles.aslCenter,Styles.pTop5]}>
                                ENTER OTP
                            </Text>
                            <View style={[Styles.aslCenter, Styles.p5, Styles.pBtm18]}>
                                <Text style={[Styles.ffLRegular, Styles.f18, Styles.colorBlue, Styles.marV10]}>The
                                    4-digit Code was sent to mobile number ({Services.returnBoldText(this.state.customerPhoneNumber,Styles.f18)}). Please enter
                                    the code to Delivery the Order ({Services.returnBoldText(this.state.orderData.wmsOrderId,Styles.f18)})</Text>
                            </View>
                            <View style={[Styles.mBtm15]}>
                                <View style={[Styles.padH15,Styles.OrdersScreenCardshadow]}>
                                    <TextInput
                                        placeholder={'Enter Code'}
                                        mode={'flat'}
                                        maxLength={4}
                                        keyboardType={'numeric'}
                                        style={[Styles.bgWhite, Styles.f18, Styles.colorBlue,Styles.bw1,Styles.bcAsh]}
                                        value={this.state.otpDigits}
                                        onChangeText={otpDigits => this.setState({otpDigits,otpErrorMessage:''})}
                                    />
                                </View>
                                {
                                    this.state.otpErrorMessage
                                    ?
                                <View style={[Styles.p3,Styles.aslCenter]}>
                                    <Text style={[Styles.f16,Styles.cDarkRed]}>{this.state.otpErrorMessage}</Text>
                                </View>
                                        :
                                        null
                                }
                            </View>
                            <View style={[Styles.marV10,Styles.pLeft10]}>
                                <View style={[Styles.row, Styles.p5]}>
                                    <Text style={[Styles.colorBlue, Styles.f18, Styles.ffMregular]}>
                                        Didn't receive the code?
                                    </Text>

                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={()=>this.sendOTP()}>
                                        <Text style={[Styles.colorGreen, Styles.f18, Styles.ffMextrabold]}>{' '}Resend OTP</Text>
                                    </TouchableOpacity>

                                </View>
                            </View>
                            <View style={[Styles.row, Styles.jSpaceArd, Styles.p5, Styles.pBtm18,]}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => this.setState({swipeActivated:false,otpVerificationModal: false,summaryDetailsConfirmed:false})}
                                    style={[Styles.aslCenter, Styles.br5, Styles.bgBlk, Styles.marH5,Styles.width120]}>
                                    <Text
                                        style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter, Styles.padH5,Styles.padV7, Styles.f16,]}>CANCEL</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        {
                                            let resp;
                                            resp = Utils.isValid4DigitOTP(this.state.otpDigits);
                                            if (resp.status === true) {
                                                if (resp.message === '...809') {
                                                    this.setState({
                                                        spinnerBool: false,
                                                        otpVerificationModal: false,
                                                        satisfiedOTP:true
                                                    }, () => {
                                                        self.finalStepVerificationCycle()
                                                    })
                                                } else {
                                                    this.verifyOTP()
                                                }
                                            } else {
                                                Utils.dialogBox(resp.message, '');
                                            }
                                        }
                                    }}
                                    style={[Styles.aslCenter, Styles.br5, Styles.bgGrn, Styles.marH5,Styles.width120]}>
                                    <Text
                                        style={[Styles.ffLBold, Styles.cWhite, Styles.aslCenter,Styles.padH5,Styles.padV7, Styles.f16,]}>VERIFY</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/*MODAL FOR ORDER CONFIRM*/}
                <Modal
                    transparent={true}
                    visible={this.state.showSummaryDetailsModal}
                    animationType={'fade'}
                    onRequestClose={() => {
                        this.setState({showSummaryDetailsModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                        <View style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 20, }]}>
                            <View style={[Styles.aslCenter,Styles.m5,Styles.padV10]}>
                                <Text style={[Styles.ffMregular,Styles.cBlk, Styles.aslCenter, Styles.p5, Styles.f18,]}>Are you sure you want to{' '}
                                    <Text style={[Styles.ffMbold,Styles.cBlk,Styles.f18,]}>{this.state.selectedButton}</Text> the list ?</Text>
                            </View>
                            <ScrollView style={[Styles.marH5]}>
                                {
                                    this.state.finalList.length > 0
                                        ?
                                        <View style={{flex:1,alignItems: 'center'}}>
                                            <Row size={12} nowrap
                                                 style={[Styles.row, Styles.padV10, Styles.alignCenter,Styles.bgOrangeYellow]}>
                                                <Col sm={4}>
                                                    <Text
                                                        style={[Styles.ffMextrabold, Styles.f16, Styles.aslCenter]}>Items</Text>
                                                </Col>
                                                <Col sm={3}>
                                                    <Text
                                                        style={[Styles.ffMextrabold, Styles.f16, Styles.aslCenter]}>Total</Text>
                                                </Col>
                                                <Col sm={2.5}>
                                                    <Text
                                                        style={[Styles.ffMextrabold, Styles.f16, Styles.aslCenter]}>Deliver</Text>
                                                </Col>
                                                <Col sm={2.5}>
                                                    <Text
                                                        style={[Styles.ffMextrabold, Styles.f16, Styles.aslCenter]}>Reject</Text>
                                                </Col>
                                            </Row>
                                            <View style={[Styles.row, Styles.aslCenter]}>
                                                {
                                                    this.state.finalList.length > 0 ?
                                                        <FlatList
                                                            style={[{height: Dimensions.get('window').height/1.8},Styles.bgWhite]}
                                                            data={this.state.finalList}
                                                            renderItem={({item, index}) => (
                                                                <Row size={12} nowrap
                                                                     style={[Styles.row, Styles.p5, Styles.aslCenter, {
                                                                         // backgroundColor: ((index % 2) === 0 ? '#f5f5f5' : '#fff')
                                                                         backgroundColor: ((index % 2) === 0 ? '#ccf6d8' : '#e4b7d4')
                                                                     }
                                                                     ]}>
                                                                    <Col sm={4}>
                                                                        <Text  style={[Styles.ffMbold, Styles.f14, {textAlignVertical: 'center'}]}>{_.startCase(item.name) || '---'}</Text>
                                                                    </Col>
                                                                    <Col sm={3}>
                                                                        <Text  style={[Styles.ffMbold, Styles.f14,Styles.aslCenter]}>{Services.returnINRhtmlcode(item.price) || '---'}({item.itemQuantity})</Text>
                                                                    </Col>
                                                                    <Col sm={2.5}>
                                                                        <Text  style={[Styles.ffMbold,Styles.colorGreen, Styles.f14,Styles.aslCenter]}>{item.tempDelivered}</Text>
                                                                    </Col>
                                                                    <Col sm={2.5}>
                                                                        <Text  style={[Styles.ffMbold,Styles.cRed, Styles.f14,Styles.aslCenter]}>{item.tempRejected}</Text>
                                                                    </Col>
                                                                </Row>
                                                            )}
                                                            keyExtractor={(item, index) => index.toString()}
                                                        />
                                                        :
                                                        <Text
                                                            style={[Styles.cBlk, Styles.f20, Styles.aslCenter, Styles.ffMregular]}>
                                                            No Items in the list.</Text>
                                                }
                                            </View>

                                        </View>
                                        :
                                        null
                                }
                            </ScrollView>
                            <View style={[Styles.row, Styles.jSpaceArd, Styles.p10, Styles.mBtm10]}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => this.setState({showSummaryDetailsModal: false,swipeActivated:false,summaryModalButton:'CANCEL',summaryDetailsConfirmed:false})}
                                                  style={[Styles.aslCenter, Styles.br5,Styles.bgBlk,Styles.width120]}>
                                    <Text
                                        style={[Styles.ffMbold,Styles.cWhite, Styles.aslCenter, Styles.padH5,Styles.padV10, Styles.f16,]}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() =>{
                                    this.setState({showSummaryDetailsModal: false,summaryDetailsConfirmed:true,swipeActivated:true,summaryModalButton:'CONFIRMATION'},()=>{
                                        this.validatingLocation()
                                    })
                                } }
                                                  style={[Styles.aslCenter, Styles.br5,Styles.bgGrn,Styles.width120]}>
                                    <Text
                                        style={[Styles.ffMbold, Styles.cWhite, Styles.aslCenter, Styles.padH5,Styles.padV10, Styles.f16,]}>Confirm</Text>
                                </TouchableOpacity>
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
                                                        color="#000" style={{marginRight: 10}}
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
                                                    <Text style={[Styles.cBlk,Styles.f18,Styles.padH5]}>ROTATE</Text>
                                                    <FontAwesome name="rotate-right" size={24} color="black"
                                                    />
                                                </TouchableOpacity>
                                            </View>

                                            <ImageZoom cropWidth={Dimensions.get('window').width}
                                                       cropHeight={Dimensions.get('window').height}
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
                                            this.deliveredImageUpload('CAMERA')
                                        })}}
                                        activeOpacity={0.7} style={[Styles.marV10,Styles.row,Styles.aitCenter]}>
                                        <FontAwesome name="camera" size={24} color="black" />
                                        <Text style={[Styles.f20,Styles.cBlk,Styles.ffLBold,Styles.padH10]}>Take Photo</Text>
                                    </TouchableOpacity>
                                    <Text style={[Styles.ffLBlack,Styles.brdrBtm1,Styles.mBtm15]}/>
                                    <TouchableOpacity
                                        onPress={()=>{this.setState({imageSelectionModal:false},()=>{
                                            this.deliveredImageUpload('LIBRARY')
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

                {/*modal for Taking Signature*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.SignatureModal}
                    onRequestClose={() => {
                        // this.setState({SignatureModal:false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                        <View style={[Styles.bgWhite]}>
                            <Text
                                style={[Styles.aslCenter, Styles.ffMbold, Styles.f18, Styles.colorBlue, Styles.padV5]}>Please
                                Sign
                                Below</Text>

                            <View style={[Styles.bgLGreen, Styles.bw3, Styles.bcBlk, {
                                margin: 5,
                            }]}>
                                <SignatureCapture
                                    style={[{
                                        width: Dimensions.get('window').width - 40,
                                        height: Dimensions.get('window').height - 150
                                    },
                                        Styles.aslCenter]}
                                    ref="sign"
                                    square={true}
                                    showBorder={true}
                                    backgroundColor={'#f1e9c2'}
                                    // onSaveEvent={this._onSaveEvent}
                                    onSaveEvent={(result)=>{
                                        if (this.state.signatureDragged) {
                                            //result.encoded - for the base64 encoded png
                                            //result.pathName - for the file path name
                                            console.log('sign result tag',result)

                                            this.UploadSignature(result)

                                            // let tempData = {}
                                            // tempData.path = result.pathName
                                            //     tempData.mime = "image/png"
                                            //
                                            // console.log('tempData of signatute',tempData);
                                            // let deliveryImagesArray = this.state.deliveryImagesArray;
                                            //
                                            // deliveryImagesArray.push(tempData);
                                            //
                                            // console.log('images array after sign',deliveryImagesArray);
                                            //
                                            // this.setState({deliveryImagesArray})
                                            //
                                            // this.requestToDeliverOrder()
                                        } else {
                                            Utils.dialogBox('Please Sign above', '')
                                        }
                                    }}
                                    // onDragEvent={this._onDragEvent}
                                    onDragEvent={()=>this.setState({signatureDragged: true})}
                                    saveImageFileInExtStorage={false}
                                    showNativeButtons={false}
                                    showTitleLabel={false}
                                    viewMode={"portrait"}
                                    minStrokeWidth={5}
                                    maxStrokeWidth={5}
                                />
                            </View>

                            <View style={[Styles.row]}>
                                <TouchableOpacity style={Styles.signaturebuttonStyle}
                                                  onPress={() => {
                                                      this.saveSign()
                                                  }}>
                                    <Text>Save</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={Styles.signaturebuttonStyle}
                                                  onPress={() => {
                                                      this.resetSign()
                                                  }}>
                                    <Text>Clear</Text>
                                </TouchableOpacity>
                                <TouchableHighlight style={Styles.signaturebuttonStyle}
                                                    onPress={() => {
                                                        this.setState({SignatureModal: false, signatureDragged: false})
                                                    }}>
                                    <Text>Cancel</Text>
                                </TouchableHighlight>

                            </View>

                        </View>

                    </View>
                </Modal>

                {/*MODALS END*/}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    signature: {
        flex: 1,
        borderColor: '#000033',
        borderWidth: 1,
    },
    buttonStyle: {
        flex: 1, justifyContent: "center", alignItems: "center", height: 50,
        backgroundColor: "#eeeeee",
        margin: 10
    }
});


