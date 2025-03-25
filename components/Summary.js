import React, {Component} from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    BackHandler,
    Modal,
    Linking,
    TouchableOpacity,
    ScrollView, Alert, ActivityIndicator
} from "react-native";
import {Column as Col, Row} from "react-native-flexbox-grid";
import {Appbar, Avatar, Card, Surface, IconButton, DefaultTheme, Title} from "react-native-paper";
import {Styles, CText, CSpinner, LoadImages} from "./common";
import Utils from './common/Utils';
import _ from "lodash";
import OfflineNotice from './common/OfflineNotice';
import Services from "./common/Services";
import HomeScreen from "./HomeScreen";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import ImageZoom from "react-native-image-pan-zoom";
import Config from "./common/Config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import item from "react-native-calendars/src/calendar-list/item";



const winWidth = Dimensions.get("window").width;
const winHeight = Dimensions.get("window").height;

export default class Summary extends Component {

    constructor(props) {
        super(props);
        this.didFocus = props.navigation.addListener('didFocus', payload =>
            BackHandler.addEventListener('hardwareBackPress', this.onBack)
        );
        this.state = {
            AttendenceResponse: '', spinnerBool: false, SupervisorDetails: '', packagesSummaryModal: false,
            subPackagesModal: false,subPackagesData:[],showSubPackages:'',selectedAction:'',

            imagePreview: false, imagePreviewURL: '',imageRotate:'0',
            imageSelectionModal:false,
        };
    }

    componentDidMount() {
        this.willBlur = this.props.navigation.addListener('willBlur', payload =>
            BackHandler.removeEventListener('hardwareBackPress', this.onBack)
        );
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            AsyncStorage.getItem('Whizzard:phoneNumber').then((phoneNumber) => {
            let shiftResponse = self.props.navigation.state.params.AttendenceResponse
            self.setState({
                phoneNumber,
                AttendenceResponse:shiftResponse,
                UserFlow: self.props.navigation.state.params.UserFlow,
                SupervisorDetails: self.props.navigation.state.params.SupervisorDetails
            }, () => {
                {
                    (shiftResponse.userRole === 1 || shiftResponse.userRole === 10) && ( shiftResponse.status === 'SHIFT_ENDED' || shiftResponse.status === "SHIFT_ENDED_BY_SUPERVISOR" && shiftResponse.deliveredPackagesInfo)
                        ? this.getAllTypesOfPackages()
                        : null
                }
                // {
                //     shiftResponse.status === 'SHIFT_ENDED'
                //     ?
                //        this.getShiftCalculatedDistance(shiftResponse)
                //         :
                //         null
                // }
                // console.log('====summary resp1===', shiftResponse);
                Services.checkMockLocationPermission((response) => {
                    if (response){
                        this.props.navigation.navigate('Login')
                    }
                })
            })
        });
        });
    }

    errorHandling(error) {
        // console.log("summary error", error, error.response);
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

    //API CALL to get END SHIFT DETAILS
    getShiftCalculatedDistance(shiftResponse) {
        const self = this;
        const apiURL = Config.routes.SOCKET_BASE_URL+Config.routes.GET_SHIFT_DISTANCE +shiftResponse.shiftId;
        const body = {};
        // console.log('summary',apiURL,shiftResponse);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, function (response) {
                if (response.status === 200) {
                        let responseData = response.data;
                    // console.log('calculated resp',response)
                        self.setState({
                            spinnerBool:false,
                            distanceResponse:response.data
                        });
                }
            }, function (error) {
                self.errorHandling(error)
            })
        });
    }

    onBack = () => {
        if (this.state.UserFlow === "SITE_ADMIN") {
            return this.props.navigation.navigate('TeamListingScreen');
        } else {
            if (this.state.AttendenceResponse.status === 'SHIFT_IN_PROGRESS') {
                return this.props.navigation.navigate('EndShiftScreen', {
                    CurrentShiftId: this.state.AttendenceResponse.id,
                    currentUserId: this.state.AttendenceResponse.userId,
                    UserFlow: (this.state.UserFlow === 'NORMAL_ADHOC_FLOW' || this.state.UserFlow === 'ADMIN_ADHOC_FLOW') ? this.state.UserFlow: 'NORMAL'
                })
            } else {
                if (this.state.UserFlow === 'ADMIN_ADHOC_FLOW'){
                    return this.props.navigation.navigate('TeamListingScreen');
                }else if (this.state.UserFlow === 'NORMAL_ADHOC_FLOW'){
                    return this.props.navigation.navigate('CreateNonRegisteredAdhocShift');
                }else {
                    return this.props.navigation.navigate('HomeScreen');
                }
            }
        }
    };

    componentWillUnmount() {
        this.didFocus.remove();
        this.willBlur.remove();
        BackHandler.removeEventListener('hardwareBackPress', this.onBack);
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    rotate(){
        let newRotation = JSON.parse(this.state.imageRotate) + 90;
        if(newRotation >= 360){
            newRotation =- 360;
        }
        this.setState({
            imageRotate: JSON.stringify(newRotation),
        })
    }

    hoursMinutesFormat(time) {
        return (
            <CText cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart,Styles.ffMregular]}>
                {new Date(time).getHours() <= 9 ? "0" + new Date(time).getHours() : new Date(time).getHours()}:
                {new Date(time).getMinutes() <= 9 ? "0" + new Date(time).getMinutes() : new Date(time).getMinutes()}
            </CText>
        )
    }

    showOrHidePackages(data) {
        if (data === true) {
            this.setState({showPackages: true})
        } else {
            this.setState({showPackages: false})
        }
    }

    //Will form an array with pickup and delivery packages
    getAllTypesOfPackages = () => {
        const deliveryPackages = this.state.AttendenceResponse.deliveredPackagesInfo; //data from params
        const pickupPackages = this.state.AttendenceResponse.pickUpPackagesInfo; //data from API
        const EndShiftArray = [];
        for (var i = 0; i < pickupPackages.length; i++) {
            for (var j = 0; j < deliveryPackages.length; j++) {
                if (pickupPackages[i].type === deliveryPackages[j].type) {
                    let sample = {};
                    sample.type = pickupPackages[i].type;
                    sample.pickupCount = pickupPackages[i].count;
                    sample.deliveryCount = deliveryPackages[j].count;
                    sample.statuses = deliveryPackages[j].statuses
                    EndShiftArray.push(sample);
                }
            }
        }
        this.setState({packagesData: EndShiftArray}, () => {
        });
    };

    DriverCollected() {
        const {AttendenceResponse} = this.state;
        return (
            <Row size={12} style={[Styles.marH10]}>
                <Col sm={6}>
                    <Surface style={[Styles.alignCenter,Styles.OrdersScreenCardshadow,{width: winWidth/2.2, height: 100,}]}>
                        <Image style={{width: winWidth/3, height: 54}} source={LoadImages.odometer_small}/>
                    </Surface>
                </Col>
                <Col sm={3}>
                    <TouchableOpacity
                        disabled={!AttendenceResponse.startOdometerReadingUploadUrl}
                        onPress={()=>{this.setState({
                            imagePreview: true,
                            imagePreviewURL: AttendenceResponse.startOdometerReadingUploadUrl
                        })}}
                        activeOpacity={0.7}
                        style={[Styles.bgWhite,Styles.OrdersScreenCardshadow, {width: winWidth/4.3, height: 100}]}>
                        <MaterialIcons name="info" size={24} color={AttendenceResponse.startOdometerReadingUploadUrl ? "black" : '#dddd'} style={[Styles.p3,Styles.aslEnd]} />
                        <View style={[Styles.alignCenter]}>
                            <Text style={[Styles.ffMbold]}>STARTING</Text>
                            <Text numberOfLines={2} style={[Styles.ffMregular]}>{AttendenceResponse.startOdometerReading}</Text>
                        </View>
                    </TouchableOpacity>
                </Col>
                <Col sm={3}>
                    <TouchableOpacity
                        disabled={!AttendenceResponse.endOdometerReadingUploadUrl}
                        onPress={()=>{this.setState({
                            imagePreview: true,
                            imagePreviewURL: AttendenceResponse.endOdometerReadingUploadUrl
                        })}}
                        activeOpacity={0.7}
                        style={[Styles.bgWhite,Styles.OrdersScreenCardshadow, {width: winWidth/4.3, height: 100}]}>
                        <MaterialIcons name="info" size={24} color={AttendenceResponse.endOdometerReadingUploadUrl ? "black" : '#dddd'} style={[Styles.p3,Styles.aslEnd]} />
                        <View style={[Styles.alignCenter]}>
                            <Text style={[Styles.ffMbold]}>ENDING</Text>
                            <Text numberOfLines={2} style={[Styles.ffMregular]}>{AttendenceResponse.endOdometerReading || '--'}</Text>
                        </View>
                    </TouchableOpacity>
                </Col>
            </Row>
        )
    }

    AssociateCollected() {
        const {AttendenceResponse} = this.state;
            if(!AttendenceResponse.hyperLocalOrdersSite || AttendenceResponse.enteredShiftDataAtStart){
                return (
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                            this.setState({packagesSummaryModal: true,showSubPackages:'',selectedAction:'packagesData'})
                        }}>
                        < Row size={12} style={[Styles.marH10,Styles.mTop2]}>
                            <Col sm={6}>
                                <Surface style={[Styles.alignCenter,Styles.OrdersScreenCardshadow,{width: winWidth/2.2, height: 100,}]}>
                                    <Image style={{width: winWidth/3, height: 54}}
                                           source={LoadImages.packages_small}/>
                                </Surface>
                            </Col>
                            <Col sm={6}>
                                <Surface style={[Styles.alignCenter,Styles.OrdersScreenCardshadow,{width: winWidth/2.13, height: 100,}]}>
                                    <Text style={[Styles.ffMbold]}>PACKAGES</Text>
                                    {
                                        AttendenceResponse.pickUpPackagesInfo === null
                                            ? null
                                            : AttendenceResponse.status === 'SHIFT_IN_PROGRESS'
                                                ? <Text style={[Styles.ffMregular]}>{AttendenceResponse.pickUpPackagesCount}</Text>
                                                :
                                                AttendenceResponse.status === 'SHIFT_ENDED' || AttendenceResponse.status === "SHIFT_ENDED_BY_SUPERVISOR"
                                                    ?
                                                    AttendenceResponse.deliveredPackagesInfo
                                                        ?
                                                        <Text style={[Styles.ffMregular]}>{this.state.AttendenceResponse.deliveredPackagesCount}</Text>
                                                        : null
                                                    :
                                                    null
                                    }
                                </Surface>
                            </Col>
                        </Row>
                    </TouchableOpacity>
                )
            }
    }

    ordersCollection() {
        const {AttendenceResponse} = this.state;
        return (
            <TouchableOpacity
                activeOpacity={0.9}
                disabled={!(AttendenceResponse.status === 'SHIFT_ENDED' || AttendenceResponse.status === "SHIFT_ENDED_BY_SUPERVISOR")}
                onPress={() => {
                this.setState({packagesSummaryModal: true,showSubPackages:'',selectedAction:'ordersData'})
            }}>
                < Row size={12} style={[Styles.marH10,Styles.mTop2]}>
                    <Col sm={6}>
                        <Surface style={[Styles.alignCenter,Styles.OrdersScreenCardshadow,{width: winWidth/2.2, height: 100,}]}>
                            <Image style={[{width: winWidth/3, height: 100},Styles.ImgResizeModeContain]}
                                   source={LoadImages.vehicle_two}/>
                        </Surface>
                    </Col>
                    <Col sm={6}>
                        <Surface style={[Styles.alignCenter,Styles.OrdersScreenCardshadow,{width: winWidth/2.13, height: 100,}]}>
                            {/*<MaterialIcons name="info" size={24} color="black" />*/}
                            <Text style={[Styles.ffMbold]}>ORDERS COUNT</Text>
                            <Text style={[Styles.ffMregular]}>{AttendenceResponse.ordersCount}</Text>
                        </Surface>
                    </Col>
                </Row>
            </TouchableOpacity>
        )
    }

    CashCollected() {
        const {AttendenceResponse} = this.state;
        if (!AttendenceResponse.hyperLocalOrdersSite || AttendenceResponse.enteredShiftDataAtStart) {
            return (
                <Row size={12}
                     style={[Styles.marH10, Styles.mTop2]}>
                    <Col sm={6}>
                        <Surface style={[Styles.alignCenter, Styles.OrdersScreenCardshadow, {
                            width: winWidth / 2.2,
                            height: 100,
                        }]}>
                            <Image style={{width: winWidth / 3, height: 54}}
                                   source={LoadImages.cash_small}/>
                        </Surface>
                    </Col>
                    <Col sm={6}>
                        <Surface style={[Styles.alignCenter, Styles.OrdersScreenCardshadow, {
                            width: winWidth / 2.13,
                            height: 100,
                        }]}>
                            <Text style={[Styles.ffMbold]}>CASH COLLECTED</Text>
                            <Text
                                style={[Styles.ffMregular]}>&#8377; {AttendenceResponse.cashCollected}</Text>
                        </Surface>
                    </Col>
                </Row>
            )
        }
    }

    //Packages Pop-up from Flatlist
    PackagesList(count,name) {
        return (
            <Card style={[Styles.marV5, Styles.marH10, {marginTop: 5},Styles.OrdersScreenCardshadow]}>
                <Card.Content style={[Styles.row, Styles.jSpaceBet]}>
                    <Title style={[Styles.ffMregular]}>{_.startCase(name)}</Title>
                    <Title></Title>
                    <Title style={[Styles.ffMregular]}>{count}
                    </Title>
                </Card.Content>
            </Card>
        )
    }

    Associate_AttResp_Pickup() {
        const {AttendenceResponse} = this.state
        return (
            this.state.selectedAction === 'ordersData'
            ?
            <View style={{padding: 10}}>
                <View style={[Styles.row, Styles.jSpaceBet, {paddingHorizontal: 15, paddingVertical: 10}]}>
                    <Text style={[Styles.f24,Styles.ffMbold,Styles.cBlk]}>Total Orders</Text>
                    <Text style={[Styles.f24,Styles.ffMbold,Styles.cBlk]}>{AttendenceResponse.ordersCount}</Text>
                </View>
                <View>
                    {
                        AttendenceResponse.ordersStatusCount
                        ?
                        AttendenceResponse.ordersStatusCount.map((item,index) => {
                            return (
                                this.PackagesList(item.count,item.status)
                            )
                        })
                            :
                            null
                    }
                </View>
            })
            </View>
                :
                <View style={{padding: 10}}>
                    <View style={[Styles.row, Styles.jSpaceBet, {paddingHorizontal: 15, paddingVertical: 10}]}>
                        <Text style={[Styles.f24,Styles.ffMbold,Styles.cBlk]}>Total Packages</Text>
                        <Text style={[Styles.f24,Styles.ffMbold,Styles.cBlk]}>{AttendenceResponse.pickUpPackagesCount}</Text>
                    </View>
                    <View>
                        {
                            AttendenceResponse.pickUpPackagesInfo
                            ?
                            AttendenceResponse.pickUpPackagesInfo.map((item,index) => {
                                return (
                                    this.PackagesList(item.count,item.type)
                                )
                            })
                                :
                                null
                        }
                    </View>
                </View>
        )
    }


    Associate_AttResp_Delivered() {
        const {AttendenceResponse} = this.state;
        return (
            <View style={[Styles.p10]}>
                <View style={[Styles.row, Styles.jSpaceBet, {paddingHorizontal: 15, paddingVertical: 10}]}>
                    <Text style={[Styles.f24,Styles.ffMbold,Styles.cBlk]}>Total Packages</Text>
                    <Text style={[Styles.f24,Styles.ffMbold,Styles.cBlk]}>{AttendenceResponse.deliveredPackagesCount}/{AttendenceResponse.pickUpPackagesCount}</Text>
                </View>
                <View>
                    {
                        this.state.packagesData
                        ?
                        this.state.packagesData.map((item,index) => {
                            return (
                                this.PackagesDelivered(item,index)
                            )
                        })
                            :
                            null
                    }
                </View>
            </View>
        )
    }

    //Packages Pop-up from Flatlist
    PackagesDelivered(item,index) {
        return (
            <ScrollView key={index}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => this.setState({showSubPackages:item.type})}
                    style={[Styles.marV5,Styles.mTop10, Styles.marH10,Styles.OrdersScreenCardshadow,Styles.p5,Styles.bgDWhite]}>
                    <View style={[Styles.row, Styles.jSpaceBet]}>
                        <Title>{item.type}</Title>
                        <Title></Title>
                        <Title style={[Styles.ffMbold]}>{item.deliveryCount}/{item.pickupCount}
                        </Title>
                    </View>
                    {
                        this.state.showSubPackages === item.type
                            ?
                            <ScrollView
                                style={[Styles.marH20,Styles.bgWhite,Styles.mTop5]}
                                persistentScrollbar={true}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={()=>{this.setState({showSubPackages:''})}}
                                    style={[Styles.row, Styles.jSpaceBet,Styles.p3,Styles.bgAsh]}>
                                    <Text
                                        style={[Styles.f16, Styles.ffMbold,Styles.colorBlue]}>Details:</Text>
                                    <MaterialIcons name="cancel" size={20} color="#000"/>
                                </TouchableOpacity>
                                {
                                    item.statuses.length > 0
                                        ?
                                        item.statuses.map((data,index) => {
                                            return(
                                                <View key={index} style={[Styles.row, Styles.jSpaceArd,Styles.brdrBtm1,Styles.p3]}>
                                                    <Text
                                                        style={[Styles.f16, Styles.ffMbold,Styles.colorBlue]}>{data.status}</Text>
                                                    <Text
                                                        style={[Styles.f16, Styles.ffMregular]}>{data.count}</Text>
                                                </View>
                                            )
                                        })
                                        : null
                                }
                            </ScrollView>
                            :
                            null
                    }
                </TouchableOpacity>
            </ScrollView>
        )
    }

    render() {
        const {AttendenceResponse,distanceResponse} = this.state;
        return (
            <View style={[{flex: 1, backgroundColor: "#f1f5f4"}]}>
                <OfflineNotice/>
                {
                    this.state.AttendenceResponse
                        ?
                        <View style={[{flex: 1, backgroundColor: "#f1f5f4"}]}>
                            <View style={[Styles.flex1]}>
                                {this.renderSpinner()}

                                {/* HEADER CHANGES FOR SHIFT STATUS*/}
                                <Appbar.Header style={[Styles.bgDarkRed]}>
                                    <Appbar.BackAction onPress={() => {
                                        this.onBack()
                                    }}/>
                                    <Appbar.Content title="Shift Summary" titleStyle={[Styles.ffLBold]}/>
                                    {/*<Appbar.Action icon="more-horiz" onPress={() => { }} />*/}
                                    <Text style={[Styles.cWhite,Styles.f17,Styles.ffMbold,Styles.pRight15]}>{AttendenceResponse.shiftDateStr}</Text>
                                </Appbar.Header>

                                <Surface style={[Styles.bgWhite,Styles.OrdersScreenCardshadow,Styles.aslStart,{width:winWidth-20},Styles.marH10,Styles.mTop10,Styles.mBtm5,Styles.p10]}>
                                    {
                                        AttendenceResponse.status === 'SHIFT_IN_PROGRESS'
                                            ?
                                            <View>
                                                <CText
                                                    cStyle={[Styles.f20, Styles.aslStart,Styles.ffLRegular]}>Shift
                                                    Status: <CText
                                                        cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart,Styles.ffLBold]}> SHIFT
                                                        STARTED</CText></CText>
                                                <CText
                                                    cStyle={[Styles.f20, Styles.padV3, Styles.aslStart,Styles.ffLRegular]}>Shift
                                                    Started at <CText
                                                        cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart,Styles.ffLBold]}>{this.hoursMinutesFormat(AttendenceResponse.actualStartTime)}</CText></CText>
                                                <CText
                                                    cStyle={[Styles.f20, Styles.padV3, Styles.aslStart,Styles.ffLRegular]}>
                                                    Marked At Site: <CText
                                                    cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart,Styles.ffLBold]}>
                                                    {AttendenceResponse.markedAtSite === false ? 'No' : 'Yes'}
                                                </CText>
                                                </CText>
                                                {
                                                    AttendenceResponse.vehicleType
                                                        ?
                                                        <CText
                                                            cStyle={[Styles.f20, Styles.padV3, Styles.aslStart, Styles.ffLRegular]}>
                                                            Vehicle Type: <CText
                                                            cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart, Styles.ffLBold]}>
                                                            {AttendenceResponse.vehicleType} Wheeler
                                                        </CText>
                                                        </CText>
                                                        :
                                                        null
                                                }
                                                {
                                                    AttendenceResponse.adhocPaymentMode
                                                        ?
                                                        <CText
                                                            cStyle={[Styles.f20, Styles.aslStart, Styles.ffLRegular]}>
                                                            Payment Type:
                                                            <CText  cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart, Styles.ffLBold]}> {AttendenceResponse.adhocPaymentMode}</CText>
                                                            {
                                                                AttendenceResponse.adhocShiftAmountPaid
                                                                    ?
                                                                    <CText
                                                                        cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart, Styles.ffLBold]}> ( &#x20B9; {AttendenceResponse.adhocShiftAmountPaid} )</CText>
                                                                    : null
                                                            }
                                                        </CText>
                                                        :
                                                        null
                                                }
                                            </View>
                                            :
                                            AttendenceResponse.status === 'SHIFT_ENDED' || AttendenceResponse.status === "SHIFT_ENDED_BY_SUPERVISOR"
                                                ?
                                                <View>
                                                    <CText
                                                        cStyle={[Styles.f20, Styles.aslStart,Styles.ffLRegular]}>Shift
                                                        Status: <CText
                                                            cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart,Styles.ffLBold]}>SHIFT
                                                            ENDED</CText></CText>
                                                    <CText
                                                        cStyle={[Styles.f20, Styles.padV3, Styles.aslStart,Styles.ffLRegular]}>
                                                        Shift Duration: <CText
                                                        cStyle={[Styles.f20, Styles.cBlk, Styles.padV3, Styles.aslStart,Styles.ffLBold]}>{AttendenceResponse.durationStr}</CText></CText>
                                                    <CText
                                                        cStyle={[Styles.f20, Styles.aslStart,Styles.ffLRegular]}>
                                                        Marked At Site: <CText
                                                        cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart,Styles.ffLBold]}>
                                                        {AttendenceResponse.markedAtSite === false ? 'No' : 'Yes'}
                                                    </CText>
                                                    </CText>
                                                    {/*{*/}
                                                    {/*    distanceResponse*/}
                                                    {/*    ?*/}
                                                    {/*        <CText*/}
                                                    {/*            cStyle={[Styles.f20, Styles.padV3, Styles.aslStart, Styles.ffLRegular]}>*/}
                                                    {/*            System Calculated Distance: <CText*/}
                                                    {/*            cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart, Styles.ffLBold]}>*/}
                                                    {/*            {distanceResponse.distance} KM*/}
                                                    {/*        </CText>*/}
                                                    {/*        </CText>*/}
                                                    {/*        :*/}
                                                    {/*        null*/}
                                                    {/*}*/}
                                                    {
                                                        AttendenceResponse.vehicleType
                                                            ?
                                                            <CText
                                                                cStyle={[Styles.f20, Styles.padV3, Styles.aslStart, Styles.ffLRegular]}>
                                                                Vehicle Type: <CText
                                                                cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart, Styles.ffLBold]}>
                                                                {AttendenceResponse.vehicleType} Wheeler
                                                            </CText>
                                                            </CText>
                                                            :
                                                            null
                                                    }
                                                    {
                                                        AttendenceResponse.cashOnDelivery ?
                                                            <CText
                                                                cStyle={[Styles.f20, Styles.padV3, Styles.aslStart,Styles.ffLRegular]}>
                                                                Cash on Delivery: <CText
                                                                cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart,Styles.ffLBold]}>
                                                                {AttendenceResponse.cashOnDelivery ? AttendenceResponse.cashOnDelivery.toFixed(1) : 'NA'}
                                                            </CText>
                                                            </CText>
                                                            : null
                                                    }

                                                    {
                                                        AttendenceResponse.adhocPaymentMode
                                                            ?
                                                            <CText
                                                                cStyle={[Styles.f20, Styles.aslStart, Styles.ffLRegular]}>
                                                                Payment Type:
                                                                <CText  cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart, Styles.ffLBold]}> {AttendenceResponse.adhocPaymentMode}</CText>
                                                                {
                                                                    AttendenceResponse.adhocShiftAmountPaid
                                                                        ?
                                                                        <CText
                                                                            cStyle={[Styles.f20, Styles.cBlk, Styles.aslStart, Styles.ffLBold]}> ( &#x20B9; {AttendenceResponse.adhocShiftAmountPaid} )</CText>
                                                                        : null
                                                                }
                                                            </CText>
                                                            :
                                                            null
                                                    }
                                                </View>
                                                :
                                                null
                                    }
                                </Surface>


                                {/*Container Contains Empty Field, DRIVER,ASSOCIATE and Both */}
                                <ScrollView
                                    persistentScrollbar={true}
                                    style={[Styles.mBtm10]}>
                                    {
                                       AttendenceResponse.status === 'ATTENDANCE_MARKED'
                                            ?
                                            null
                                            :
                                            <View>
                                                {
                                                   AttendenceResponse.userRole >= 15
                                                        ? null
                                                        :
                                                        AttendenceResponse.userRole === 10
                                                            //both ODOMETER and PACKAGE COUNT
                                                            ?
                                                            <View>
                                                                {this.DriverCollected()}
                                                                {this.AssociateCollected()}
                                                            </View>
                                                            :
                                                            AttendenceResponse.userRole === 5 //only ODOMETER READINGS
                                                                ?
                                                                this.DriverCollected()
                                                                :
                                                                AttendenceResponse.userRole === 1 //only PACKAGES COUNT
                                                                    ?
                                                                    this.AssociateCollected()
                                                                    :
                                                                    null
                                                }
                                                {
                                                    AttendenceResponse.ordersCount > 0
                                                    ?
                                                        this.ordersCollection()
                                                        :
                                                        null
                                                }

                                                {/* CASH COLLECTED*/}
                                                {
                                                    (AttendenceResponse.userRole === 1 || AttendenceResponse.userRole === 10) && (AttendenceResponse.status === 'SHIFT_ENDED' || AttendenceResponse.status === "SHIFT_ENDED_BY_SUPERVISOR")
                                                            ?
                                                            this.CashCollected()
                                                            :
                                                            null
                                                }

                                                {/* FLATLIST FOR SUPERVISOR DETAILS VIEW */}
                                                {this.state.SupervisorDetails
                                                    ?
                                                    this.state.SupervisorDetails.length === 0 || this.state.SupervisorDetails === null
                                                        ?
                                                        <Card.Title
                                                                    style={[Styles.marV5, Styles.bgWhite,Styles.ffMbold]}
                                                                    title="No Supervisor assigned"
                                                                    left={() => <Avatar.Icon icon="contact-phone"
                                                                                             size={55}
                                                                                             style={[Styles.aslCenter, Styles.p5]}/>}
                                                        />
                                                        :
                                                    this.state.SupervisorDetails.map((item,index)=>{
                                                        return(
                                                            Services.getSupervisorList(item, 'summary')
                                                        )
                                                    })

                                                    :
                                                    null
                                                }
                                            </View>
                                    }
                                </ScrollView>


                            </View>

                            {/* MODAL FOR PRE-SUMMARY SHIFT END */}
                            <Modal
                                transparent={true}
                                visible={this.state.packagesSummaryModal}
                                onRequestClose={() => {
                                    this.setState({packagesSummaryModal: false})
                                }}>
                                <View style={[Styles.modalfrontPosition]}>
                                    <TouchableOpacity onPress={() => {
                                        this.setState({packagesSummaryModal: false})
                                    }}
                                                      style={[Styles.modalbgPosition]}>
                                    </TouchableOpacity>
                                    <View
                                        style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, {width: winWidth - 50}]}>
                                        <Card.Title
                                                    style={[Styles.pTop5, Styles.bgWhite,Styles.ffMregular]}
                                                   titleStyle={[Styles.aslCenter]}
                                                    title={this.state.selectedAction === 'ordersData'? "Orders Summary":"Packages Summary"}
                                        />
                                        <ScrollView
                                            persistentScrollbar={true}
                                            style={{height: Dimensions.get('window').height / 1.5}}>
                                            {
                                                this.state.selectedAction === 'ordersData'
                                                ?
                                                    this.Associate_AttResp_Pickup()
                                                    :
                                                AttendenceResponse.userRole === 1 || AttendenceResponse.userRole === 10
                                                    ?
                                                    AttendenceResponse.status === 'SHIFT_IN_PROGRESS'
                                                        ?
                                                        this.Associate_AttResp_Pickup()
                                                        :
                                                        AttendenceResponse.deliveredPackagesInfo
                                                            ?
                                                            this.Associate_AttResp_Delivered()
                                                            :
                                                            null
                                                    :
                                                    null
                                            }
                                        </ScrollView>
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
                                                        <View style={[Styles.row, Styles.jSpaceBet]}>
                                                            <View/>
                                                            <TouchableOpacity style={[Styles.row, Styles.marH10]}
                                                                              onPress={() => {
                                                                                  this.rotate()
                                                                              }}>
                                                                <Text
                                                                    style={[Styles.colorBlue, Styles.f18, Styles.padH5]}>ROTATE</Text>
                                                                <FontAwesome name="rotate-right" size={24} color="black"
                                                                />
                                                            </TouchableOpacity>
                                                        </View>

                                                        <ImageZoom cropWidth={Dimensions.get('window').width}
                                                                   cropHeight={Dimensions.get('window').height}
                                                                   imageWidth={Dimensions.get('window').width}
                                                                   imageHeight={Dimensions.get('window').height}>
                                                            <Image
                                                                onLoadStart={() => this.setState({previewLoading: true})}
                                                                onLoadEnd={() => this.setState({previewLoading: false})}
                                                                style={[{
                                                                    width: Dimensions.get('window').width - 20,
                                                                    height: Dimensions.get('window').height - 90,
                                                                    transform: [{rotate: this.state.imageRotate + 'deg'}]
                                                                }, Styles.marV5, Styles.aslCenter, Styles.bgDWhite, Styles.ImgResizeModeContain]}
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

                        </View>
                        :
                        <CSpinner/>
                }
            </View>
        );
    }
}

const styles = StyleSheet.create({
    appbar: {
        backgroundColor: "white"
    },
    container: {
        marginTop: 10
    },
    surface: {
        padding: 4,
        alignItems: "center",
        justifyContent: "center",
        elevation: 1
    },

    row: {
        marginLeft: 10,
        marginTop: 2,
        marginRight: 10
    },
    info: {
        fontSize: 14,
        marginLeft: 20,
        lineHeight: 20,
        marginTop: 5
    },
    inline: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderRadius: 5,
        padding: 8
    }
});
