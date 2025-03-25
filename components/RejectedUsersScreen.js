import React, {Component} from "react";
import {
    View,
    Text,
    StyleSheet,
} from "react-native";
import {FAB, Colors, DefaultTheme} from "react-native-paper";
import {CText,Styles} from "./common";
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import OfflineNotice from './common/OfflineNotice';

export default class RejectedUsersScreen extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <View style={[Styles.flex1, {backgroundColor: '#140a25',}]}>
                <OfflineNotice/>
                <View style={[Styles.flex1, {
                    backgroundColor: '#140a25',
                    justifyContent: 'center',
                    alignSelf: 'center',
                    textAlign: 'center'
                }]}>

                    <View style={[Styles.padH10]}>
                        <MaterialIcons style={{textAlign: 'center'}} name="block" size={100} color="red"/>
                        <CText
                            cStyle={[Styles.f22, Styles.cWhite, Styles.marV5, Styles.txtAlignCen,Styles.ffMregular]}>Your Profile has been Rejected, Please contact supervisor. </CText>
                    </View>

                </View>
            </View>


        );
    }
}

const styles = StyleSheet.create({
    appbar: {
        backgroundColor: "white"
    },
    container: {
        flex: 1,
        alignItems: "center"
    }
});
