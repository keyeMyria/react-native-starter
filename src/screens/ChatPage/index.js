// @flow
import * as React from "react";
import {
  View,
  Platform,
  UIManager,
  TouchableHighlight,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Observer, inject, observer } from "mobx-react/native";
import { View as AnimView, Text as AnimText } from "react-native-animatable";
import { Icon as Ico, Text, Item, Input } from "native-base";
import Icon from "react-native-vector-icons/FontAwesome";
import styles from "./styles";
import ChatList from "./ChatList";
import Constants from "../../global/constants";
import ImagePreviewer from "../../components/SingleImagePreviewer";
import { DatePickerDialog } from "../../components/datepickerdialog";
import moment from "moment";

export interface Props {
  navigator: any;
  chatList: [];
  chatAnimate: Function;
  sendPressed: Function;
  playSound: Function;
  stopSound: Function;
  startRecording: Function;
  stopRecording: Function;
}

export interface State {
  mixedHeights: [];
  cumulativeMixedHeights: [];
}

let chatView: object;

@inject("chatViewStore")
@observer
class ChatPage extends React.Component<Props, State> {
  _micRef: any;

  constructor() {
    //Enable LayoutAnimation for Android
    if (Platform.OS === "android") {
      UIManager.setLayoutAnimationEnabledExperimental &&
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    super();
    this.state = {};

    this.listRef = null;
  }

  componentDidMount() {
    chatView = this.props.chatViewStore;

    this.keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      this._keyboardDidShow.bind(this),
    );
    this.keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      this._keyboardDidHide.bind(this),
    );
  }

  componentWillUnmount() {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  componentWillReceiveProps(nextProps) {
    // console.warn("CL:" + JSON.stringify(nextProps.chatList));
    //Scroll To Begining(or end, since inverted) when new chat gets updated in chatlist
    // if (nextProps.chatList.length > 2) {
    //   this.listRef.scrollToIndex({ viewPosition: 0, index: 0 });
    // }
  }

  _keyboardDidShow() {
    this.props.chatViewStore.isKeyboardOpen = true;
  }

  _keyboardDidHide() {
    this.props.chatViewStore.isKeyboardOpen = false;
  }

  _receiveChatAction(ipTxt, action) {
    if (action === "imgPreview") {
      chatView.imageToPreview = ipTxt;
    } else if (action === "phone/datepicker") {
      this.invokeDatePickerDialog();
    } else {
      this.props.sendPressed(ipTxt, action);
    }
  }

  // invoke DatePickerDialog
  invokeDatePickerDialog = () => {
    let date = new Date();

    //To open the dialog
    this.dateDialog.open({
      date: date,
      maxDate: new Date(), //To restrict future date
    });
  };

  // Call back for date Dialog picked event
  onDatePicked = date => {
    // console.warn(moment(date).format("DD-MMM-YYYY"));
    this.props.sendPressed(moment(date).format("DD-MMM-YYYY"), "booking/flight=city?date");
  };

  _sendChat() {
    if (chatView.inputString !== "") {
      this.props.sendPressed(chatView.inputString, null);
      this.input._root.clear();
      this._micRef.bounceIn(400).then(() => {
        chatView.inputString = "";
      });
    }
  }

  _recordingTimer() {
    let actualTime = this.props.chatViewStore.recordingTime;
    let recordTime = "00:00";
    let minutes = 0;
    let seconds = actualTime;
    if (actualTime > 59) {
      minutes = Math.floor(actualTime / 60);
      seconds = actualTime % 60;
    }
    if (seconds < 10) {
      if (minutes === 0) {
        recordTime = "00:0" + seconds;
      } else {
        recordTime = "0" + minutes + ":0" + seconds;
      }
    } else {
      if (minutes === 0) {
        recordTime = "00:" + seconds;
      } else {
        recordTime = "0" + minutes + ":" + seconds;
      }
    }

    return recordTime;
  }

  _playSound(id, audioPath) {
    this.props.playSound(id, audioPath);
  }
  _stopSound() {
    this.props.stopSound();
  }

  // _renderNavBar(param: any) {
  //   return (
  //     <Header>
  //       <Left>
  //         <Button transparent onPress={() => this.props.navigation.goBack()}>
  //           <Ico name="ios-arrow-back" />
  //         </Button>
  //       </Left>

  //       <Body style={{ flex: 3 }}>
  //         <Title>{param ? param.name.item : "Blank Page"}</Title>
  //       </Body>

  //       <Right />
  //     </Header>
  //   );
  // }

  _renderInputBar() {
    let recordTime = this._recordingTimer();
    let chatView = this.props.chatViewStore;

    return (
      <View style={styles.InputBarView}>
        {chatView.voiceRecording ? (
          <View
            style={{
              flex: chatView.voiceRecording ? 0.85 : 0.9,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-evenly",
            }}>
            <AnimView
              useNativeDriver={true}
              animation="flash"
              easing="ease-in-out-sine"
              iterationCount="infinite"
              style={{ flex: 0.3, alignItems: "center", justifyContent: "center" }}>
              <Icon name="microphone" size={30} color={"#FF0000"} />
            </AnimView>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flex: 0.7,
                justifyContent: "space-between",
              }}>
              <AnimText
                style={{ fontSize: 15 }}
                useNativeDriver={true}
                animation="pulse"
                easing="ease-in-out-sine"
                iterationCount="infinite">
                {recordTime}
              </AnimText>
              <Text style={{ color: "grey" }}> Slide to Cancel </Text>
            </View>
          </View>
        ) : (
          <Item rounded style={{ flex: 0.9 }}>
            <Input
              ref={ref => {
                this.input = ref;
              }}
              onChangeText={text => {
                chatView.inputString = text;
              }}
              style={{ height: 90 }}
              multiline={true}
              placeholder="Start typing here.."
            />
          </Item>
        )}

        <AnimView
          style={{
            flex: chatView.voiceRecording ? 0.15 : 0.1,
            alignItems: "center",
            justifyContent: "center",
          }}
          ref={ref => {
            this._micRef = ref;
          }}>
          {chatView.inputString.length === 0 && !chatView.isKeyboardOpen ? (
            <TouchableWithoutFeedback
              onPressIn={evt => {
                chatView.micTouchX = Math.floor(evt.nativeEvent.locationX);
                chatView.micTouchY = Math.floor(evt.nativeEvent.locationY);
                this._micRef.swing(300).then(() => {
                  this.props.startRecording();
                });
              }}
              onPressOut={evt => {
                let tempX = evt.nativeEvent.locationX;
                let tempY = evt.nativeEvent.locationY;
                this._micRef.zoomOut(300).then(() => {
                  if (
                    Math.abs(Math.floor(tempX) - chatView.micTouchX > 30) ||
                    Math.abs(Math.floor(tempY) - chatView.micTouchY > 30)
                  ) {
                    this.props.stopRecording(true);
                  } else {
                    this.props.stopRecording(false);
                  }
                  this._micRef.zoomIn(300);
                });
              }}
              style={{ padding: chatView.voiceRecording ? 2 : 6 }}>
              <Icon
                name="microphone"
                size={chatView.voiceRecording ? 40 : 30}
                color={Constants.Colors.darkAccent}
              />
            </TouchableWithoutFeedback>
          ) : (
            <TouchableOpacity
              onPress={() => {
                this._sendChat();
              }}
              style={{ padding: 3, paddingRight: 2 }}>
              <Icon
                name="comment"
                size={30}
                color={Constants.Colors.darkAccent}
                style={{ marginTop: -3 }}
              />
            </TouchableOpacity>
          )}
        </AnimView>
      </View>
    );
  }

  _renderDateDialog() {
    return (
      <DatePickerDialog
        ref={ref => {
          this.dateDialog = ref;
        }}
        onDatePicked={this.onDatePicked.bind(this)}
      />
    );
  }

  _renderImagePreview() {
    return (
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
        }}>
        <ImagePreviewer imagePath={chatView.imageToPreview} />

        <TouchableHighlight
          style={styles.closeIcon}
          underlayColor="rgba(255, 255, 255, 0.5)"
          onPress={() => {
            chatView.imageToPreview = "";
          }}>
          <Ico
            name="close"
            style={{
              alignSelf: "center",
              justifyContent: "center",
              color: "#f4511e",
            }}
            size={42}
          />
        </TouchableHighlight>
      </View>
    );
  }

  _renderCoreUI(param) {
    return (
      <View style={{ flex: 1 }}>
        {/* {this._renderNavBar(param)} */}

        {/* {this._renderChatList()} */}

        <ChatList
          chatList={this.props.chatList}
          receiveChatAction={this._receiveChatAction.bind(this)}
          playSound={this._playSound.bind(this)}
          stopSound={this._stopSound.bind(this)}
          chatAnimate={this.props.chatAnimate.bind(this)}
        />

        {this._renderInputBar()}
      </View>
    );
  }

  render() {
    const param = null; //this.props.navigation.state.params;
    // const { chatViewStore } = this.props;

    return (
      <View style={styles.container}>
        {this.props.chatViewStore.imageToPreview &&
        this.props.chatViewStore.imageToPreview.length > 0
          ? this._renderImagePreview()
          : this._renderCoreUI(param)}

        {this._renderDateDialog()}
      </View>
    );
  }
}

export default ChatPage;

/* Moved to ChatList.js */
// _renderChatItem(itm, indx) {
//   let item = itm;
//   let tempAnim = item.animate;

//   this.props.chatAnimate(indx, 0);
//   // console.warn("RENDER ITEM:" + JSON.stringify(item));

//   switch (item.isUser) {
//     case true:
//       switch (item.type) {
//         case "txt":
//           return (
//             <ChatTextBlob
//               title={item.title}
//               text={item.text}
//               isUser={true}
//               chatAction={null}
//               animate={tempAnim}
//             />
//           );

//         case "audio":
//           return (
//             <AudioBlob
//               id={indx}
//               isUser={true}
//               isPlaying={item.isPlaying}
//               audioPath={item.audioPath}
//               playSound={this._playSound.bind(this)}
//               stopSound={this._stopSound.bind(this)}
//             />
//           );
//       }
//       break;

//     case false:
//       switch (item.type) {
//         case "txt":
//           return (
//             <ChatTextBlob
//               title={item.title}
//               text={item.text}
//               isUser={false}
//               options={item.options}
//               chatAction={this._receiveChatAction.bind(this)}
//               showIcon={item.showIcon}
//               animate={tempAnim}
//             />
//           );

//         case "img":
//           return (
//             <ChatImageBlob
//               title={item.title}
//               text={item.text}
//               image={item.imgUrl}
//               chatAction={this._receiveChatAction.bind(this)}
//               showIcon={item.showIcon}
//               animate={tempAnim}
//             />
//           );

//         case "loader":
//           return <LoaderIndicator />;

//         case "opts":
//           return (
//             <OptionsBlob
//               optionsList={item.options}
//               chatAction={this._receiveChatAction.bind(this)}
//               animate={item.animate}
//             />
//           );
//       }
//   }
// }

/* Moved to ChatList.js */
// _renderChatList() {
//   // let chatList = this.props.chatStore.chatList.toJS();
//   return (
//     <View style={styles.ListView}>
//       <FlatList
//         inverted={true}
//         ref={ref => {
//           this.listRef = ref;
//         }}
//         style={{ width: "100%" }}
//         renderItem={({ item, index }) => {
//           return <Observer>{() => this._renderChatItem(item, index)}</Observer>;
//         }}
//         keyExtractor={item => "" + item.id}
//         // initialScrollIndex = {this.state.initialScrollIndex}

//         // Fixed Height getItemLayout
//         // getItemLayout = {(data, index) => {
//         //   return {length: 400, offset: 400 * index, index}
//         // }}

//         // Variable Height getItemLayout (REF: FLATLISTHEIGHTTEST PROJECT)
//         // getItemLayout={(data, index) => {
//         //   return {
//         //     length: this.state.mixedHeights[index],
//         //     offset: this.state.cumulativeMixedHeights[index],
//         //     index,
//         //   };
//         // }}
//         initialListSize={5} //listview optimization
//         pageSize={10} //listview optimization
//         data={this.props.chatList}
//         // extraData={this.props.chatStore.chatList.toJS()}
//       />
//     </View>
//   );
// }
