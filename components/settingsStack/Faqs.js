import * as React from "react";
import {View, Text, StyleSheet, BackHandler} from "react-native";
import { Appbar} from "react-native-paper";


export default class Faqs extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View>
        <Appbar.Header style={styles.appbar}>
          <Appbar.BackAction onPress={() => this.props.navigation.goBack()} />
          <Appbar.Content title="FAQs" />
        </Appbar.Header>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  appbar: {
    backgroundColor: "white"
  }
});
