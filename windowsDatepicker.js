import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  Picker,
  View,
  Text,
  Image,
  Modal,
  TouchableHighlight,
  DatePickerAndroid,
  TimePickerAndroid,
  DatePickerIOS,
  Platform,
  Animated,
  Keyboard,
  Dimensions
} from 'react-native';
import Style from './style';
import Moment from 'moment';
import _ from 'lodash';

const FORMATS = {
  'date': 'YYYY-MM-DD',
  'datetime': 'YYYY-MM-DD HH:mm',
  'time': 'HH:mm'
};

const SUPPORTED_FORMATS = {
	'GENERIC_DATE_FORMAT': 'YYYY-MM-DD',
	'ISO_DATETIME_FORMAT': 'YYYY-MM-DDTHH:mm:ss',
	'DISPLAY_DATETIME_FORMAT': 'M/D/YYYY h:mma'
}

class WindowsDatePicker extends Component {
  constructor(props) {
    super(props);

	this.pickerStyle = {
		height: 50,
		width: 100
	}

	this._onYearPicked = this._onYearPicked.bind(this);
	this._onMonthPicked = this._onMonthPicked.bind(this);
	this._onDayPicked = this._onDayPicked.bind(this);
	this._onHourPicked = this._onHourPicked.bind(this);
	this._onMinutePicked = this._onMinutePicked.bind(this);
	this._onSecondPicked = this._onSecondPicked.bind(this);
	this._onAmPmPicked = this._onAmPmPicked.bind(this);

	let mode = _.get(props, 'mode', 'datetime');

	this.format = _.get(props, 'format', SUPPORTED_FORMATS.GENERIC_DATE_FORMAT);
	
	let formatFound = false;
	
	if (this.format === SUPPORTED_FORMATS.GENERIC_DATE_FORMAT ||
		this.format === SUPPORTED_FORMATS.ISO_DATETIME_FORMAT ||
		this.format === SUPPORTED_FORMATS.DISPLAY_DATETIME_FORMAT) {
		formatFound = true;
	}
	
	// for the format to be of the same type as the mode, or if unspecified then default to something appropriate for the mode.
	if (formatFound === false) {
		if (mode === 'datetime') {
			this.format = SUPPORTED_FORMATS.ISO_DATETIME_FORMAT;
		}
		else {
			this.format = SUPPORTED_FORMATS.GENERIC_DATE_FORMAT;
		}
	}
	else {
		if (mode === 'datetime' && this.format === SUPPORTED_FORMATS.GENERIC_DATE_FORMAT) {
			this.format = SUPPORTED_FORMATS.ISO_DATETIME_FORMAT;
		}
		else if (mode === 'date' && this.format !== SUPPORTED_FORMATS.GENERIC_DATE_FORMAT) {
			this.format = SUPPORTED_FORMATS.GENERIC_DATE_FORMAT;
		}
	}

	let components = this._getDateComponents(this.getDateStr());

    this.state = {
      date: this.getDate(),
	  dateComponents: components
    };

    this.getDate = this.getDate.bind(this);
    this.getDateStr = this.getDateStr.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.date !== this.props.date) {
	  let components = this._getDateComponents(this.getDateStr(nextProps.date));

      this.setState({date: this.getDate(nextProps.date), dateComponents: components});
    }
  }

  _getDateComponents(dateStr) {
	let dt = Moment(dateStr);
	
	let displayHour = 0;
	let amPm = '';
	
	if (this.format === SUPPORTED_FORMATS.DISPLAY_DATETIME_FORMAT) {
		let hour = dt.get('hour');
		
		if (hour <= 12) {
			displayHour = hour;
			
			if (hour < 12) {
				amPm = 'am';
			}
			else {
				amPm = 'pm';
			}
		}
		else {
			displayHour = hour - 12;
			amPm = 'pm';
		}
	}
	else {
		displayHour = dt.get('hour'); 
	}
	
	let components = {
		year: dt.get('year'),
		month: dt.get('month') + 1,
		day: dt.get('date'),
		displayHour: displayHour,
		amPm: amPm,
		hour: dt.get('hour'),
		minute: dt.get('minute'),
		second: dt.get('second')
	}
	
	return components;
  }

  getDate(date = this.props.date) {
    const {mode, minDate, maxDate, format = FORMATS[mode]} = this.props;

    if (!date) {
      let now = new Date();
      if (minDate) {
        let _minDate = this.getDate(minDate);

        if (now < _minDate) {
          return _minDate;
        }
      }

      if (maxDate) {
        let _maxDate = this.getDate(maxDate);

        if (now > _maxDate) {
          return _maxDate;
        }
      }

      return now;
    }

    if (date instanceof Date) {
      return date;
    }

    return Moment(date, format).toDate();
  }

  getDateStr(date = this.props.date) {
    const {mode, format = FORMATS[mode]} = this.props;

    const dateInstance = date instanceof Date
      ? date
      : this.getDate(date);

    if (typeof this.props.getDateStr === 'function') {
      return this.props.getDateStr(dateInstance);
    }

    return Moment(dateInstance).format(format);
  }

  datePicked() {
    if (typeof this.props.onDateChange === 'function') {
      this.props.onDateChange(this.getDateStr(this.state.date), this.state.date);
    }
  }

  _onDateChangeCallback() {
	  let callback = _.get(this, 'props.onDateChange', null);
	  
	  if (callback === null) {
		  return;
	  }
	  
	//reconstruct the date and call the callback with the new date  
	
	let dateComponents = this.state.dateComponents;

	let momentObj = Moment();
	momentObj.set('year', dateComponents.year);
	momentObj.set('month', dateComponents.month - 1);
	momentObj.set('date', dateComponents.day);
	momentObj.set('hour', dateComponents.hour);
	momentObj.set('minute', dateComponents.minute);
	momentObj.set('second', dateComponents.second);
	
	let dateStr = momentObj.format(this.format);
	let dateObj = momentObj.toDate();
	
	callback(dateStr, dateObj);
  }

  // year picker 

  _onYearPicked(itemValue, itemIndex) {
	  let self = this;
	  
	  this.setState({
		  dateComponents: {
			  ...this.state.dateComponents,
			  year: itemValue
		  }
	  }, function() {
	  	  self._onDateChangeCallback();
	  });	  
  }

  _getYearPickerItems(minDate, maxDate) {
	  let pickerItems = [];
	  
	  // if the min/max date are specified, cap the years
	  
	  let minYear = minDate.getFullYear();
	  let maxYear = maxDate.getFullYear();
	  
	  for (var year = minYear; year <= maxYear; year++) {
		  pickerItems.push(<Picker.Item key={year} label={year+""} value={year} />);
	  }
	  
	  return pickerItems;
  }
  
  _renderDateYearPicker(minDate, maxDate) {
	let pickerItems = this._getYearPickerItems(minDate, maxDate);
	
	let year = _.get(this, 'state.dateComponents.year', 1970);
	
	return (
		<Picker
			selectedValue={year}
			style={this.pickerStyle}
			onValueChange={this._onYearPicked}
		>
		{pickerItems}
		</Picker>	
	);
  }

  // month picker 

  _onMonthPicked(itemValue, itemIndex) {
	  let self = this;
	  
	  this.setState({
		  dateComponents: {
			  ...this.state.dateComponents,
			  month: itemValue
		  }
	  }, function() {
		self._adjustDayForMonth();
	  });
  }

  _getMonthPickerItems() {
	  let pickerItems = [];
	  
	  let minMonth = 1;
	  let maxMonth = 12;
	  
	  for (var month = minMonth; month <= maxMonth; month++) {
		  let label = "";
		  
		  if (this.format === SUPPORTED_FORMATS.GENERIC_DATE_FORMAT || this.format === SUPPORTED_FORMATS.ISO_DATETIME_FORMAT) {
			  let monthStr = "";
			  
			  if (month <= 9) {
				  monthStr += "0";
			  }
			  
			  monthStr += month;
			  
			  label = monthStr;
		  }
		  else {
			  label = month + "";
		  }
		  
		  pickerItems.push(<Picker.Item key={month} label={label} value={month} />);
	  }
	  
	  return pickerItems;
  }
  
  _renderDateMonthPicker() {
	let pickerItems = this._getMonthPickerItems();

	let month = _.get(this, 'state.dateComponents.month', 1);
	
	return (
		<Picker
			selectedValue={month}
			style={this.pickerStyle}
			onValueChange={this._onMonthPicked}
		>
		{pickerItems}
		</Picker>	
	);
  }

  // day picker 

  _getDaysInMonth() {
	  let year = _.get(this, 'state.dateComponents.year', 1970);
	  let month = _.get(this, 'state.dateComponents.month', 1);
	  
	  let monthAndYearStr = year + "-";
	  
	  if (month <=9) {
		  monthAndYearStr += "0";
	  }
	  
	  monthAndYearStr += month;
	  
	  return Moment(monthAndYearStr, "YYYY-MM").daysInMonth();
  }

  _adjustDayForMonth() {
	  let day = _.get(this, 'state.dateComponents.day', 1);

	  let numDaysInMonth = this._getDaysInMonth();
	  
	  let self = this;
	  
	  // Decide whether or not this day falls within the valid day range for this year and month. If so, return the day as is.
	  // If not, return the last day of this month for this year.
	  if (day > numDaysInMonth) {
		  this.setState({
			 dateComponents: {
				 ...this.state.dateComponents,
				 day: numDaysInMonth
			 }
		  }, function() {
			 self._onDateChangeCallback();
		  });
	  }
	  else {
		  this._onDateChangeCallback();
	  }
  }

  _onDayPicked(itemValue, itemIndex) {
	  let self = this;
	  
	  this.setState({
		  dateComponents: {
			  ...this.state.dateComponents,
			  day: itemValue
		  }
	  }, function() {
		self._onDateChangeCallback();
	  });
  }

  _getDayPickerItems() {
	  let pickerItems = [];
	  
	  // if the min/max date are specified, cap the years
	  
	  let minDay = 1;
	  let maxDay = this._getDaysInMonth();
	  
	  for (var day = minDay; day <= maxDay; day++) {
		  let label = "";
		  
		  if (this.format === SUPPORTED_FORMATS.GENERIC_DATE_FORMAT || this.format === SUPPORTED_FORMATS.ISO_DATETIME_FORMAT) {
			  let dayStr = "";
			  
			  if (day <= 9) {
				  dayStr += "0";
			  }
			  
			  dayStr += day;
			  
			  label = dayStr;
		  }
		  else {
			  label = day + "";
		  }
		  
		  pickerItems.push(<Picker.Item key={day} label={label} value={day} />);
	  }
	  
	  return pickerItems;
  }
  
  _renderDateDayPicker() {
	let pickerItems = this._getDayPickerItems();
	
	let day = _.get(this, 'state.dateComponents.day', 1);
	
	// if the person previously had picked a day that is outside of what is now the current calendar month, then set
	// the day back to the last day of that month
	
	return (
		<Picker
			selectedValue={day}
			style={this.pickerStyle}
			onValueChange={this._onDayPicked}
		>
		{pickerItems}
		</Picker>	
	);
  }

  // =========================

  _renderDatePicker(minDate, maxDate) {
	let mode = _.get(this, 'props.mode', 'datetime');
	
	if (mode === 'time') {
		return null;
	}

	if (this.format === SUPPORTED_FORMATS.DISPLAY_DATETIME_FORMAT) {
	  return (
		<View style={{flexDirection: 'row', alignItems: 'center'}}>
			{this._renderDateMonthPicker()}
			<Text> / </Text>
			{this._renderDateDayPicker()}
			<Text> / </Text>
			{this._renderDateYearPicker(minDate, maxDate)}
		</View>
	  );		
	}
	else {
	  return (
		<View style={{flexDirection: 'row', alignItems: 'center'}}>
			{this._renderDateYearPicker(minDate, maxDate)}
			<Text> - </Text>
			{this._renderDateMonthPicker()}
			<Text> - </Text>
			{this._renderDateDayPicker()}
		</View>
	  );
	}	  
  }

  // =========================

  // hour picker 

  _onHourPicked(itemValue, itemIndex) {
	  let self = this;
	  
	  let hour = 0;
	  let displayHour = itemValue;
	  
	  if (this.format === SUPPORTED_FORMATS.DISPLAY_DATETIME_FORMAT) {
		  let amPm = _.get(this, 'state.dateComponents.amPm', 'am');

		if (amPm === 'am') {
			hour = itemValue;
			
			if (itemValue === 12) {
				hour = 0;
			}
		}
		else {

			hour = itemValue;

			if (itemValue !== 12) {
				hour = itemValue + 12;
			}
		}

	  }
	  else {
		  hour = itemValue;
	  }
	  
	  this.setState({
		  dateComponents: {
			  ...this.state.dateComponents,
			  hour: hour,
			  displayHour: displayHour
		  }
	  }, function() {
		self._onDateChangeCallback();  
	  });
  }

  _getHourPickerItems() {
	  let pickerItems = [];
	  
	  let minHour = 0;
	  let maxHour = 23;
	  
	  if (this.format === SUPPORTED_FORMATS.ISO_DATETIME_FORMAT) {
		  maxHour = 23;
	  }
	  else if (this.format === SUPPORTED_FORMATS.DISPLAY_DATETIME_FORMAT) {
		  maxHour = 12;
	  }
	  
	  for (var hour = minHour; hour <= maxHour; hour++) {
		  let label = "";
		  
		  if (this.format === SUPPORTED_FORMATS.ISO_DATETIME_FORMAT) {
			  if (hour <= 9) {
				  label += "0";
			  }
			  
			  label += hour;
		  }
		  else {
			  label = hour + "";
		  }
		  
		  pickerItems.push(<Picker.Item key={hour} label={label} value={hour} />);
	  }
	  
	  return pickerItems;
  }
  
  _renderDateHourPicker() {
	let pickerItems = this._getHourPickerItems();
	
	let hour = _.get(this, 'state.dateComponents.displayHour', 0);
	
	return (
		<Picker
			selectedValue={hour}
			style={this.pickerStyle}
			onValueChange={this._onHourPicked}
		>
		{pickerItems}
		</Picker>	
	);
  }

  // minute picker 

  _onMinutePicked(itemValue, itemIndex) {
	  let self = this;
	  
	  this.setState({
		  dateComponents: {
			  ...this.state.dateComponents,
			  minute: itemValue
		  }
	  }, function() {
		  self._onDateChangeCallback();
	  });
  }

  _getMinutePickerItems() {
	  let pickerItems = [];
	  
	  let minMin = 0;
	  let maxMin = 59;
	  
	  for (var min = minMin; min <= maxMin; min++) {
		  let label = "";
		  
			  if (min <= 9) {
				  label += "0";
			  }
			  
			  label += min;
		  
		  pickerItems.push(<Picker.Item key={min} label={label} value={min} />);
	  }
	  
	  return pickerItems;
  }
  
  _renderDateMinutePicker() {
	let pickerItems = this._getMinutePickerItems();
	
	let minute = _.get(this, 'state.dateComponents.minute', 0);
	
	return (
		<Picker
			selectedValue={minute}
			style={this.pickerStyle}
			onValueChange={this._onMinutePicked}
		>
		{pickerItems}
		</Picker>	
	);
  }

  // second picker 

  _onSecondPicked(itemValue, itemIndex) {
	  let self = this;
	  
	  this.setState({
		  dateComponents: {
			  ...this.state.dateComponents,
			  second: itemValue
		  }
	  }, function() {
		self._onDateChangeCallback();
	  });	  
  }

  _getSecondPickerItems() {
	  let pickerItems = [];
	  
	  let minSec = 0;
	  let maxSec = 59;
	  
	  for (var sec = minSec; sec <= maxSec; sec++) {
		  let label = "";
		  
		  if (this.format === SUPPORTED_FORMATS.ISO_DATETIME_FORMAT) {
			  if (sec <= 9) {
				  label += "0";
			  }
			  
			  label += sec;
		  }
		  
		  pickerItems.push(<Picker.Item key={sec} label={label} value={sec} />);
	  }
	  
	  return pickerItems;
  }
  
  _renderDateSecondPicker() {
	  
	  if (this.format === SUPPORTED_FORMATS.DISPLAY_DATETIME_FORMAT) {
		  return null;
	  }
	  
	let pickerItems = this._getSecondPickerItems();
	
	let second = _.get(this, 'state.dateComponents.second', 0);
	
	return (
	<View style={{flexDirection: 'row'}}>
		<Text> : </Text>
		<Picker
			selectedValue={second}
			style={this.pickerStyle}
			onValueChange={this._onSecondPicked}
		>
		{pickerItems}
		</Picker>	
		</View>
	);
  }

	// am/pm
	
	_onAmPmPicked(itemValue, itemIndex) {
	  let self = this;
	    
		let displayHour = _.get(this, 'state.dateComponents.displayHour', 0);
		let hour = 0;
		
		if (itemValue === 'am') {
			hour = displayHour;
			
			if (displayHour === 12) {
				hour = 0;
			}
		}
		else {

			hour = displayHour;

			if (displayHour !== 12) {
				hour = displayHour + 12;
			}
		}
	
	  this.setState({
		  dateComponents: {
			  ...this.state.dateComponents,
			  hour: hour,
			  amPm: itemValue
		  }
	  }, function() {
		self._onDateChangeCallback();
	  });	  		
	}

  _renderAmPmPicker() {
	  if (this.format !== SUPPORTED_FORMATS.DISPLAY_DATETIME_FORMAT) {
		  return null;
	  }
	  
	  let pickerItems = [];

      pickerItems.push(<Picker.Item key='am' label='am' value='am' />);
      pickerItems.push(<Picker.Item key='pm' label='pm' value='pm' />);
	  
	  let amPm = _.get(this, 'state.dateComponents.amPm', 1);
	  
	  let pickerStyle = {...this.pickerStyle, paddingLeft: 20};
	  
	return (
		<Picker
			selectedValue={amPm}
			style={pickerStyle}
			onValueChange={this._onAmPmPicked}
		>
		{pickerItems}
		</Picker>	
	);	  
  }
  
  _renderTimePicker() {
	let mode = _.get(this, 'props.mode', 'datetime');
	
	if (mode === 'date') {
		return null;
	}

	return (
		<View style={{flexDirection: 'row', alignItems: 'center'}}>
			{this._renderDateHourPicker()}
			<Text> : </Text>
			{this._renderDateMinutePicker()}
			{this._renderDateSecondPicker()}
			{this._renderAmPmPicker()}
			
		</View>
	);	  
  }

  // =========================

  _getMinDate() {
	  let defaultMinDate = Moment('1970-01-01').format(this.format);
	  
	  let minDateStr = _.get(this, 'props.minDate', defaultMinDate);

	  let minDate = Moment(minDateStr).toDate();

	  return minDate;
  }

  _getMaxDate() {
	  let defaultMaxDate = Moment('2500-01-01').format(this.format);
	   
	  let maxDateStr = _.get(this, 'props.maxDate', defaultMaxDate);

	  let maxDate = Moment(maxDateStr).toDate();

	  return maxDate;
  }

  render() {
	  let minDate = this._getMinDate();
	  let maxDate = this._getMaxDate();

	  let outerStyle = {...this.props.style, flexDirection: 'row', flex:1,justifyContent:'center', borderWidth: 1, borderColor: '#fff'}
      let style = {flexWrap: 'wrap', alignItems: 'flex-start'}
	  let innerStyle = {paddingTop: 5, paddingBottom: 5, paddingRight: 10, paddingLeft: 10}

	  return (
	  <View style={outerStyle}>
		<View style={style}>
		  <View style={innerStyle}>
			{this._renderDatePicker(minDate, maxDate)}
		  </View>
		  <View style={innerStyle}>
			{this._renderTimePicker()}
		  </View>
		  </View>
		</View>
	  );
	}
}

export default WindowsDatePicker;
