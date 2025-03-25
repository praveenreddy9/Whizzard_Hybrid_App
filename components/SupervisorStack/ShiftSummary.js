import React, {Component} from "react";
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ScrollView,
    FlatList
} from "react-native";
import {Appbar, Card, Title} from "react-native-paper";
import {Styles, CText, CSpinner} from "../common";
import _ from "lodash";
import OfflineNotice from '../common/OfflineNotice';
import Services from "../common/Services";
import Config from "../common/Config";
import Utils from "../common/Utils";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import Icon from "react-native-vector-icons/dist/FontAwesome";


const width = Dimensions.get("window").width;
const height = Dimensions.get("window").height;


export default class ShiftSummary extends Component {

    constructor(props) {
        super(props);
        this.state ={showPackagesListModal:false,deliveryHistory:[]}
    }

    componentDidMount() {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            self.setState({
                shiftId: self.props.navigation.state.params.shiftId,
            }, function () {
                // console.log('getShiftSummary shiftId',self.state.shiftId);
                self.getShiftSummary()
            })
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
        });
    }

    errorHandling(error) {
        console.log("shift summary error", error, error.response);
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

    showOrHidePackages(data) {
        if (data === true) {
            this.setState({showPackages: true})
        } else {
            this.setState({showPackages: false})
        }
    }

    getShiftSummary() {
        const self = this;
        const body = '';
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_SHIFT_SUMMARY + self.state.shiftId;
        // console.log("getShiftSummary apiURL", apiURL);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, function (response) {
                if (response.status === 200) {
                    // console.log("getShiftSummary resp", response.data);
                    const shiftData = response.data;
                    self.setState({shiftData: shiftData, spinnerBool: false},()=>{
                        // self.getShiftCalculatedDistance()
                    })
                }
            }, function (error) {
                // console.log('getShiftSummary error', error, error.response);
                self.errorHandling(error);
            })
        })
    }

    //API CALL to get END SHIFT DETAILS
    getShiftCalculatedDistance() {
        const self = this;
        const apiURL = Config.routes.SOCKET_BASE_URL+Config.routes.GET_SHIFT_DISTANCE + self.state.shiftId;
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

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    ShiftTimings(item) {
        var timeHours = new Date(item).getHours();
        var timeMinutes = new Date(item).getMinutes();
        return (
            item
            ?
            <Title style={[Styles.ffMbold,{
                fontSize: 18,
                textAlign: 'center'
            }]}>{timeHours <= 9 ? ('0' + timeHours) : (timeHours)}:{timeMinutes <= 9 ? ("0" + timeMinutes) : timeMinutes}</Title>
                :
                <Title style={[Styles.ffMbold,{
                    fontSize: 18,
                    textAlign: 'center'
                }]}>--:--</Title>
        )
    }

    //Will form an array with pickup and delivery packages
    getAllTypesOfPackages = (item) => {
        const packagesData = item;
        const deliveryPackages = packagesData.deliveredPackagesInfo;
        const pickupPackages = packagesData.pickUpPackagesInfo;
        const EndShiftArray = [];
        if (pickupPackages && deliveryPackages) {
            for (var i = 0; i < pickupPackages.length; i++) {
                for (var j = 0; j < deliveryPackages.length; j++) {
                    if (pickupPackages[i].type === deliveryPackages[j].type) {
                        let sample = {};
                        sample.type = pickupPackages[i].type;
                        sample.pickupCount = pickupPackages[i].count;
                        sample.deliveryCount = deliveryPackages[j].count;
                        sample.statuses = deliveryPackages[j].statuses;
                        EndShiftArray.push(sample);
                    }
                }
            }
        }else  if (pickupPackages) {
            for (var k = 0; k < pickupPackages.length; k++) {
                         let sample = {};
                        sample.type = pickupPackages[k].type;
                        sample.pickupCount = pickupPackages[k].count;
                         EndShiftArray.push(sample);
             }
        }
        // console.log('EndShiftArray,',EndShiftArray);
        this.setState({deliveryHistory: EndShiftArray});
    };

    FetchFinalCount(item) {
        // console.log('FetchFinalCount item', item);
        return (
            <View style={[Styles.bgWhite]}>
            <View style={styles.inline}>
                <Text  style={[Styles.ffMregular,Styles.f18]}>{item.type}</Text>
                {
                    item.deliveryCount
                    ?
                        <Text style={[Styles.ffMbold,Styles.f20]}>{item.deliveryCount}/{item.pickupCount}</Text>
                        :
                        <Text style={[Styles.ffMbold,Styles.f20]}>{item.pickupCount}</Text>
                }
            </View>
                {
                    item.statuses.map((item)=>{
                        return(
                            <View style={[Styles.row, Styles.jSpaceBet, Styles.marH20, Styles.p5]}>
                                <Text style={[Styles.f16, Styles.ffMregular, Styles.txtAlignLt]}>{item.status}</Text>
                                <Text style={[Styles.f16, Styles.ffMregular, Styles.txtAlignRt]}>{item.count}</Text>
                            </View>
                        )
                    })
                }
            </View>

        )
    }


    render() {
        const {shiftData,distanceResponse} = this.state;
        return (
            <View style={[{flex: 1, backgroundColor: "#f1f5f4"}]}>
                <OfflineNotice/>
                {
                     shiftData
                        ?
                        <View style={[{flex: 1, backgroundColor: "#f1f5f4"}]}>
                            <View style={[Styles.flex1]}>
                                {this.renderSpinner()}

                                {/* HEADER CHANGES FOR SHIFT STATUS*/}
                                <Appbar.Header style={[Styles.bgDarkRed]}>
                                    <Appbar.BackAction onPress={() => {
                                        this.props.navigation.goBack()
                                    }}/>
                                    <Appbar.Content titleStyle={[Styles.cWhite,Styles.f18,Styles.ffMbold]} title="Shift Summary" subtitle=""/>
                                    <Text style={[Styles.f18,Styles.cWhite,Styles.ffMbold,Styles.p5,Styles.txtAlignRt]}> {shiftData.shiftDateStr}</Text>
                                </Appbar.Header>
                                <View style={{padding: 10}}>
                                    <View style={[Styles.aslCenter]}>
                                        <Text style={[Styles.colorBlue,Styles.ffMbold,Styles.f16,Styles.aslCenter]}>{shiftData.attrs.userName}{ } ({Services.getUserRoles(shiftData.userRole)})</Text>
                                        <View style={[Styles.row,Styles.aslCenter,]}>
                                            <View style={[Styles.row]}>
                                                <Text style={[Styles.colorBlue,Styles.f16,Styles.aslCenter, Styles.ffMbold]}>{_.startCase(_.lowerCase(shiftData.userStatus))}</Text>
                                            </View>
                                            <Text style={[Styles.colorBlue,Styles.ffMbold,Styles.f16,Styles.aslCenter,Styles.padH10]}>||</Text>
                                            <Text style={[Styles.colorBlue,Styles.f16,Styles.aslCenter, Styles.ffMbold]}>{shiftData.mobileNumber}</Text>
                                        </View>
                                        {/*<Text style={[Styles.colorBlue,Styles.ffMbold,Styles.f16,Styles.aslCenter]}>{shiftData.attrs.site} ({shiftData.attrs.client})</Text>*/}
                                        <Text style={[Styles.colorBlue,Styles.ffMbold,Styles.f16,Styles.aslCenter]}>{shiftData.attrs.siteCode} ({shiftData.attrs.client})</Text>
                                        {
                                            shiftData.clientUserIdInfo === null
                                            ?
                                                null
                                                :
                                                <Text style={[Styles.colorBlue,Styles.ffMbold,Styles.f16,Styles.aslCenter]}>{shiftData.clientUserIdInfo.clientUserId}</Text>
                                        }
                                         <View style={[Styles.row,Styles.aslCenter,]}>
                                             <View style={[Styles.row]}>
                                                 <Text style={[Styles.colorBlue,Styles.ffMregular,Styles.f16,Styles.aslCenter]}>Marked at Site: </Text>
                                                 <Text style={[Styles.colorBlue,Styles.f16,Styles.aslCenter, Styles.ffMbold]}>{shiftData.markedAtSite === false ?'No':'Yes'}</Text>
                                             </View>
                                             <Text style={[Styles.colorBlue,Styles.ffMbold,Styles.f16,Styles.aslCenter,Styles.padH10]}>||</Text>
                                             <Text style={[Styles.colorBlue,Styles.f16,Styles.aslCenter, Styles.ffLBlack,{color:Services.getShiftStatusColours(shiftData.status)}]}>{_.startCase(shiftData.status)}</Text>
                                        </View>
                                        {
                                            shiftData.status === 'SHIFT_CLOSED_BY_SUPERVISOR' || shiftData.status === 'SHIFT_CANCELLED_BY_SUPERVISOR'
                                            ?
                                        <Text style={[Styles.colorBlue,Styles.ffMregular,Styles.f16,Styles.aslCenter]}>({shiftData.attrs.cancellationReason})</Text>
                                                :
                                                null
                                        }

                                        {
                                            !shiftData.unRegisteredUserAdhocShift
                                                ?
                                                // shiftData.systemCalculatedTripDistance > 0
                                                // distanceResponse.distance > 0

                                                    <View style={[Styles.row,Styles.aslCenter]}>
                                                        <Text style={[Styles.colorBlue,Styles.ffMregular,Styles.f16,Styles.aslCenter]}>System Calculated Distance: </Text>
                                                        <Text style={[Styles.colorBlue,Styles.f16,  Styles.aslCenter, Styles.ffMbold]}>{shiftData.systemCalculatedTripDistance} KM</Text>
                                                    </View>
                                                    :
                                                null
                                        }

                                        {
                                            shiftData.vehicleType
                                                ?
                                                <View style={[Styles.row,Styles.aslCenter]}>
                                                <Text style={[Styles.colorBlue,Styles.ffMregular,Styles.f16,Styles.aslCenter]}>Vehicle Type: </Text>
                                                 <Text style={[Styles.colorBlue,Styles.f16,  Styles.aslCenter, Styles.ffMbold]}>{shiftData.vehicleType} Wheeler</Text>
                                                </View>
                                                :
                                                null
                                        }
                                        {
                                            shiftData.adhocPaymentMode
                                                ?
                                                <View style={[Styles.row,Styles.aslCenter]}>
                                                    <Text style={[Styles.colorBlue,Styles.ffMregular,Styles.f16,Styles.aslCenter]}>Adhoc Payment: </Text>
                                                    <Text style={[Styles.colorBlue,Styles.f16,Styles.aslCenter, Styles.ffMbold]}>{shiftData.adhocPaymentMode}</Text>
                                                    {
                                                        shiftData.adhocShiftAmountPaid ?

                                                            <Text
                                                                style={[Styles.colorBlue, Styles.f16, Styles.aslCenter, Styles.ffMbold]}> ( &#x20B9; {shiftData.adhocShiftAmountPaid} )</Text>
                                                            :
                                                            null
                                                    }
                                                </View>
                                                :
                                                null
                                        }


                                    </View>
                                </View>

                                <ScrollView>
                                            <Card
                                                  style={[Styles.marH10, {marginTop: 1, borderRadius: 0}]}>
                                                <Card.Content
                                                    style={[Styles.row, Styles.jSpaceBet,Styles.f18]}>
                                                    <Title style={[Styles.f18]}>Duration</Title>
                                                    <Title/>
                                                    <Title style={[Styles.ffMbold,Styles.f18]}>{this.state.shiftData.durationStr || '--:--'}({(this.state.shiftData.attrs.expectedDuration) / 60 || '000'}h)</Title>
                                                </Card.Content>
                                            </Card>
                                            <View
                                                style={[Styles.row, Styles.marH10, Styles.alignCenter]}>
                                                <Card
                                                      style={[Styles.flex1, Styles.alignCenter, {
                                                          borderRadius: 0,
                                                          marginVertical: 1,
                                                          marginRight: 1,
                                                          padding: 5
                                                      }]}>
                                                    <Text
                                                        style={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>{this.ShiftTimings(this.state.shiftData.reportingTime)}({this.state.shiftData.startTime.hours <= 9
                                                        ? "0" + this.state.shiftData.startTime.hours : this.state.shiftData.startTime.hours}:{this.state.shiftData.startTime.minutes <= 9
                                                        ? "0" + this.state.shiftData.startTime.minutes : this.state.shiftData.startTime.minutes})
                                                    </Text>
                                                </Card>
                                                <Card style={[Styles.flex1, Styles.alignCenter, {
                                                    borderRadius: 0,
                                                    marginLeft:1,
                                                    marginVertical: 1,
                                                    padding: 5
                                                }]}>
                                                    <Text
                                                        style={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>{this.ShiftTimings(this.state.shiftData.actualEndTime)}({this.state.shiftData.endTime.hours <= 9
                                                        ? "0" + this.state.shiftData.endTime.hours : this.state.shiftData.endTime.hours}:{this.state.shiftData.endTime.minutes <= 9
                                                        ? "0" + this.state.shiftData.endTime.minutes : this.state.shiftData.endTime.minutes})
                                                    </Text>
                                                </Card>

                                            </View>
                                            {
                                                // ODOMETER READINGS,TRIP ROUTE
                                                (shiftData.status === "SHIFT_IN_PROGRESS" || shiftData.status === "SHIFT_ENDED" || shiftData.status === "SHIFT_ENDED_BY_SUPERVISOR") && (this.state.shiftData.userRole === 5 || this.state.shiftData.userRole === 10)
                                                    ?
                                                    <View style={{marginTop: 5, marginBottom: 5}}>
                                                        <Card
                                                              style={[Styles.marH10, {  marginTop: 5,   borderRadius: 0 }]}>
                                                            <Card.Content
                                                                style={[Styles.row, Styles.jSpaceBet, {fontSize: 18}]}>
                                                                <Title style={{fontSize: 18}}>Trip</Title>
                                                                <Title/>
                                                                <Title/>
                                                                <Title style={[Styles.ffMbold,Styles.f18]}>{
                                                                    this.state.shiftData.status === "SHIFT_IN_PROGRESS" ?
                                                                        this.state.shiftData.startOdometerReading :
                                                                        this.state.shiftData.endOdometerReading - this.state.shiftData.startOdometerReading
                                                                }
                                                                    km</Title>
                                                                {
                                                                    !shiftData.unRegisteredUserAdhocShift
                                                                        ?
                                                                        <MaterialIcons
                                                                            onPress={() => this.setState({showPackagesListModal: false}, function () {
                                                                                this.props.navigation.navigate('MyTripsMapView', {shiftId: this.state.shiftData.shiftId})
                                                                            })}
                                                                            name="location-on" size={30}/>
                                                                        :
                                                                        null
                                                                }
                                                            </Card.Content>
                                                        </Card>
                                                        <View
                                                            style={[Styles.row, Styles.jSpaceBet, Styles.marH10, Styles.alignCenter]}>
                                                            <Card
                                                                  style={[Styles.flex1, {
                                                                      borderRadius: 0,
                                                                      marginVertical: 1,
                                                                      marginRight: 1
                                                                  }]}>
                                                                <Card.Content>
                                                                    <Title style={[Styles.ffMbold,{
                                                                        fontSize: 18,
                                                                        textAlign: 'center'
                                                                    }]}>{this.state.shiftData.startOdometerReading}</Title>
                                                                </Card.Content>

                                                            </Card>
                                                            <Card
                                                                  style={[Styles.flex1, {
                                                                      borderRadius: 0,
                                                                      marginVertical: 1,
                                                                      marginLeft:1,
                                                                      textAlign: 'center'
                                                                  }]}>
                                                                <Card.Content>
                                                                    <Title style={[Styles.ffMbold,{
                                                                        fontSize: 18,
                                                                        textAlign: 'center'
                                                                    }]}>{this.state.shiftData.endOdometerReading}</Title>
                                                                </Card.Content>
                                                            </Card>

                                                        </View>
                                                    </View>
                                                    :
                                                    shiftData.status === 'SHIFT_CLOSED_BY_SUPERVISOR' || shiftData.status === 'SHIFT_CANCELLED_BY_SUPERVISOR' || shiftData.status === 'REPORTED_ABSENT'
                                                    ?
                                                        null
                                                        :
                                                        !shiftData.unRegisteredUserAdhocShift
                                                        ?
                                                    <TouchableOpacity
                                                        activeOpacity={0.7}
                                                        onPress={() => this.setState({showPackagesListModal: false},()=> {
                                                            this.props.navigation.navigate('MyTripsMapView', {shiftId: this.state.shiftData.shiftId})
                                                        })}
                                                        style={{marginTop: 5, marginBottom: 5}}>
                                                        <Card
                                                              style={[Styles.marH10, {  marginTop: 5,   borderRadius: 0 }]}>
                                                            <Card.Content
                                                                style={[Styles.row, Styles.jSpaceBet, {fontSize: 18}]}>
                                                                <Title style={{fontSize: 18}}>Trip Route</Title>
                                                                <MaterialIcons
                                                                    name="location-on" size={30}/>
                                                            </Card.Content>
                                                        </Card>
                                                    </TouchableOpacity>
                                                            :
                                                            null
                                            }

                                            {
                                                //CashCollected
                                                (shiftData.status === "SHIFT_ENDED" || shiftData.status === "SHIFT_ENDED_BY_SUPERVISOR") && (this.state.shiftData.userRole === 1 || this.state.shiftData.userRole === 10)
                                                    ?
                                                    <View>
                                                        <Card
                                                              style={[Styles.marH10, {
                                                                  marginTop: 5,
                                                                  borderRadius: 0
                                                              }]}>
                                                            <Card.Content
                                                                style={[Styles.row, Styles.jSpaceBet, {fontSize: 18}]}>
                                                                <Title style={{fontSize: 18}}>Cash
                                                                    Collected</Title>
                                                                <Title/>
                                                                <Title style={[Styles.ffMbold,Styles.f18]}> <Icon name="inr"
                                                                          size={20}/> {this.state.shiftData.cashCollected}
                                                                </Title>
                                                            </Card.Content>
                                                        </Card>
                                                    </View>
                                                        :
                                                        null
                                            }

                                            {
                                                //packages
                                                (shiftData.status === "SHIFT_IN_PROGRESS" || shiftData.status === "SHIFT_ENDED" || shiftData.status === "SHIFT_ENDED_BY_SUPERVISOR") && (this.state.shiftData.userRole === 1 || this.state.shiftData.userRole === 10)
                                                    ?
                                                    <TouchableOpacity
                                                        onPress={() => this.setState({showPackages: !this.state.showPackages}, () => {
                                                            this.getAllTypesOfPackages(this.state.shiftData)
                                                        })}>
                                                        <Card
                                                              style={[Styles.marV10, Styles.marH10, {
                                                                  borderRadius: 0,
                                                                  backgroundColor: this.state.showPackages === true ? '#ccc' : '#fff'
                                                              }]}>
                                                            <Card.Content
                                                                style={[Styles.row, Styles.jSpaceBet, {fontSize: 18}]}>
                                                                <Title style={{fontSize: 18}}>Packages</Title>
                                                                <Title/>
                                                                {
                                                                    shiftData.status === "SHIFT_ENDED" || shiftData.status === "SHIFT_ENDED_BY_SUPERVISOR"
                                                                        ?
                                                                        <Title  style={[Styles.ffMbold, Styles.f18]}>{shiftData.deliveredPackagesCount}/{ shiftData.pickUpPackagesCount }</Title>
                                                                        :
                                                                        <Title  style={[Styles.ffMbold, Styles.f18]}>{shiftData.pickUpPackagesCount}</Title>
                                                                }
                                                                <Title><MaterialIcons
                                                                    name={this.state.showPackages === true ? 'expand-less' : 'expand-more'}
                                                                    size={30}/></Title>
                                                            </Card.Content>
                                                        </Card>
                                                    </TouchableOpacity>
                                                    :
                                                    null
                                            }
                                            {
                                                //Packages Details,will show only after showPackages is true
                                                this.state.showPackages === true ?
                                                    <View style={[Styles.padH20,Styles.mBtm20]}>
                                                        {this.state.deliveryHistory.map((item, index) => (
                                                            <View key={index}>
                                                                {this.FetchFinalCount(item)}
                                                            </View>
                                                        ))}
                                                    </View>
                                                    : null
                                            }

                                        </ScrollView>
                            </View>
                        </View> :
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
