/**
 * schemaHelpers namespace contains helper functions for handling json-schema
 *
 */
(function (schemaHelpers) {
  'use strict';

  // read this: https://javascriptweblog.wordpress.com/2011/02/07/truth-equality-and-javascript/
  // and this: http://webreflection.blogspot.rs/2010/10/javascript-coercion-demystified.html
  // to fully understand code below

  function isNull(obj) {
    return obj == null;
  }

  function isNullOrEmpty(obj) {
    return obj == null || obj.toString() == '';
  }

  function notNull(obj) {
    return obj != null;
  }

  function notNullOrEmpty(obj) {
    return !isNullOrEmpty(obj)
  }

  function formatJson(obj) {
    return JSON.stringify(obj, null, ' ');
  }

  function capitalize(obj) {
    if (!isString(obj)) {
      return obj;
    }
    if (obj.length === 0) {
      return obj;
    }
    var
      find = obj[0],
      replace = find.toUpperCase();
    obj = obj.replace(find, replace);
    return obj;
  }

  function isString(obj) {
    return Object.prototype.toString.call(obj) === "[object String]";
  }

  function isObject(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]";
  }

  function isFunction(obj) {
    return Object.prototype.toString.call(obj) === "[object Function]";
  }

  function isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  }

  function isNumber(obj) {
    return Object.prototype.toString.call(obj) === "[object Number]";
  }

  schemaHelpers.isObject = isObject;
  schemaHelpers.isString = isString;
  schemaHelpers.isArray = isArray;
  schemaHelpers.isNumber = isNumber;

  schemaHelpers.isNull = isNull;
  schemaHelpers.isNullOrEmpty = isNullOrEmpty;
  schemaHelpers.notNull = notNull;
  schemaHelpers.notNullOrEmpty = notNullOrEmpty;
  schemaHelpers.formatJson = formatJson;
  schemaHelpers.capitalize = capitalize;
  schemaHelpers.isFunction = isFunction;

  /**
   * This function tests for equality of two variables
   * it works for primitive types string, number, boolean, null and undefined
   * and reference types of object and array
   *
   * For primitive types equality is tested with === operator
   * For arrays both arrays must have same length and at each index values must also be equal. Equality is tested by recursively calling areEqual function
   * For objects both objects must have same number of properties, property names must match and property values must match.
   * Property names testing is not "deep". Only Object.keys(obj) are tested
   * Property name equality is tested with === operator and property value equality is tested by recursively calling areEqual function
   */
  function areEqual(obj1, obj2) {
    var result = false;
    var obj1PropertyValue;
    var obj2PropertyValue;

    if (isArray(obj1) && isArray(obj2)) {
      result = obj1.length === obj2.length;
      // if lengths are different return false
      if(!result) {
        return result;
      }

      // else compare items in the arrays for equality
      for (var i = 0; i < obj1.length && result; i++) {
        obj1PropertyValue = obj1[i];
        obj2PropertyValue = obj2[i];
        result = areEqual(obj1PropertyValue, obj2PropertyValue);
      }
    } else if (isObject(obj1) && isObject(obj2)) {
      var obj1Properties = Object.keys(obj1);
      var obj2Properties = Object.keys(obj2);
      // tests that these arrays have same lengths and same names
      result = areEqual(obj1Properties, obj2Properties);

      if (!result) {
        return result;
      }
      // test that every property in both objects has same value
      for (var j = 0; j < obj1Properties.length && result; j++) {
        var obj1PropertyName = obj1Properties[j];
        var obj2PropertyName = obj2Properties[j];
        obj1PropertyValue = obj1[obj1PropertyName];
        obj2PropertyValue = obj2[obj2PropertyName];
        result = areEqual(obj1PropertyValue, obj2PropertyValue);
      }
    } else if (isFunction(obj1) && isFunction(obj2)) {
      result = obj1.toString() === obj2.toString();
    } else {
      // this tests string, number, boolean, null and undefined
      result = obj1 === obj2;
    }

    return result;
  }

  schemaHelpers.areEqual = areEqual;

  function isBoolean(obj) {
    return Object.prototype.toString.call(obj) === "[object Boolean]";
  }

  function parseBool(obj) {
    var result = false;
    // if obj is undefined or null result is false
    if (isBoolean(obj)) {
      // if obj is a boolean value return obj
      result = obj;
    } else if (isString(obj)) {
      // if obj is empty string return false, else return true
      result = obj !== "";

      if (result) {
        // if obj is a non empty string
        // parse int from it because it can be a number literal
        var intObj = parseFloat(obj);

        if (obj === "false" || obj === "0" || obj === "null" || obj === "undefined") {
          // if obj is a  string literal "false" or string literal "0" or string literal "null" or literal "undefined" return false
          result = false;
        } else if (!isNaN(intObj)) {
          // if intObj is a valid number
          result = intObj > 0;
        }
      }
    } else if (isNumber(obj)) {
      // if obj is number and greater than zero return true, else return false
      result = obj > 0;
    } else if (isArray(obj) || isObject(obj) || isFunction(obj)) {
      result = true;
    }

    return result;
  }
  schemaHelpers.parseBool = parseBool;

  var isPropertyNameValid = function (propertyName) {
    // propertyName should contain only lowercase letters, numbers and underscores. It should start with underscore or lowercase letter
    // regex should be used
    var result = isString(propertyName) && propertyName.indexOf(' ') === -1;
    if (!result) {
      console.log('Property name: ' + propertyName + ' is invalid. Property name can contain lowercase letters, numbers and underscores. It must start with a lowercase letter or an underscore.');
      console.log('See: schema-helepers.js -> isPropertyNameValid function');
    }
    return result;
  }
  schemaHelpers.isPropertyNameValid = isPropertyNameValid;

  var valueNotReadOnly = function (element) {
    return element && element.properties && element.properties.value && !element.properties.value.readOnly;
  }

  schemaHelpers.valueNotReadOnly = valueNotReadOnly;
  /**
   * For the given property definition it returns display type for that property
   * at-core-form, at-form-complex, at-form-array and form designer share getDisplayType function
   * since each of these elements has different unsupportedTypes list it is passed as a parameter into this function
   * @param {Object} propertyDefinition - property definition
   * @param {Array} unsupportedTypes - list of types that should be reported as unsupported and default result returned
   * @return {String} "string" if propertyDefinition contains an unsupported type, or (type, xtype) -> result otherwise
   */
  var getDisplayType = function (propertyDefinition, unsupportedTypes) {
    var
      displayType = "string",
      type = propertyDefinition.type,
      xtype = propertyDefinition.xtype,
      hasEnum = !!propertyDefinition.enum;

    if (isNullOrEmpty(type)) {
      console.log("Type not declared or type is empty for property definition. Type string assigned by default.");
      console.log("Property definition: " + formatJson(propertyDefinition));
      return displayType;
    }

    if (isFunction(type)) {
      var typeFunctionResult = type();
      if (isString(typeFunctionResult)) {
        type = "string";
      } else if (isNumber(typeFunctionResult)) {
        type = "number";
      } else if (isBoolean(typeFunctionResult)) {
        type = "boolean";
      } else if (isObject(typeFunctionResult)) {
        type =  "object";
      } else if (isArray(typeFunctionResult)) {
        type = "array";
      } else {
        type = "string";
      }
    }

    displayType = type;
    if (hasEnum) {
      displayType = "enum";
    } else if (notNullOrEmpty(xtype)) {
      displayType = propertyDefinition.xtype;
    }

    if (unsupportedTypes.indexOf(displayType) !== -1) {
      console.log("Type " + displayType + " is not supported.");
      console.log("Property definition: " + formatJson(propertyDefinition));
      console.log("Using type string as default");
      displayType = "string";
    }

    return displayType;
  };

  schemaHelpers.getDisplayType = getDisplayType;

  var createElement = function (propertyName, displayType, propertyDefinition, elementName) {
    var element;
    var label = notNull(propertyDefinition.title) ? propertyDefinition.title : capitalize(propertyName);
    var required = Boolean(propertyDefinition.required);
    var disabled = Boolean(propertyDefinition.disabled);

    if (!propertyDefinition.title && propertyDefinition.description) {
      label = propertyDefinition.description;
    }

    element = document.createElement(elementName);

    element.label = label;
    element.required = required;
    element.disabled = disabled;

    var propertyNames = getElementProperties(element);

    // ignore list is a list of properties that should not be copied using copy properties because they are
    // either already set in code above [ label,  required, disabled, title ]
    // should not be copied to element [ type, xtype, default ]
    // or never present in json schema [ value, valid ]
    // MPS-17 when mapping.elementName === 'at-form-lookup' [available, xvaluelist and enum are ignored ]
    var ignoreList = ["label", "value", "valid", "required", "disabled", "title", "type", "default" ];
    copyProperties(propertyNames, ignoreList, propertyDefinition, element);

    if (displayType === "toggle") {
      element.toggle = true;
    }
    if (displayType === "object") {
      if (isNull(propertyDefinition.properties)) {
        console.log('For ' + propertyName + ' property of type ' + propertyDefinition.type + ' properties property is undefined.');
      } else {
        var schemaValues = convertPropertiesToSchemaValues(propertyDefinition.properties);
        element.schema = schemaValues.schema;
        element.value = schemaValues.values;
      }
    }

    if (displayType === "radio") {
      var available = propertyDefinition.available;
      var xvaluelist = propertyDefinition.xvaluelist;
      var enumVal = propertyDefinition.enum;

      // MPS-17 available is ignored
      // if both xvaluelist and enum are present and not empty, xvluelist takes precedence
      var isValueListEmpty = true;
      var isEnumEmpty = true;
      if (xvaluelist !== null && xvaluelist !== undefined) {
        isValueListEmpty = isArray(xvaluelist) && xvaluelist.length === 0;
      }
      if (enumVal !== null && enumVal !== undefined) {
        isEnumEmpty = isArray(enumVal) && enumVal.length === 0;
      }

      if (!isValueListEmpty && !isEnumEmpty) {
        element.xvaluelist = xvaluelist;
      } else if (!isValueListEmpty) {
        element.xvaluelist = xvaluelist;
      } else if (!isEnumEmpty) {
        element.enum = enumVal;
      } else {
        element.available = available;
      }
      
    } else if (displayType === "checkboxlist") {
      if (isArray(propertyDefinition.xvaluelist) || isString(propertyDefinition.xvaluelist)) {
        element.xvaluelist = propertyDefinition.xvaluelist;
      }
    }

    return element;
  };

  schemaHelpers.createElement = createElement;

  var getElementProperties = function (element) {
    var propertyNames = Object.keys(element.properties);

    // figure out properties in behaviors
    if (isArray(element.behaviors)) {
      var bi;
      var bLen = element.behaviors.length;
      var behavior;
      var bProperties;
      var bPropertyNames;
      var propDef;
      for (bi = 0; bi < bLen; bi += 1) {
        behavior = element.behaviors[bi];
        bProperties = behavior.properties;
        if (bProperties) {
          bPropertyNames = Object.keys(bProperties);
          bPropertyNames.forEach(function (bPropName, index) {
            propertyNames.push(bPropName);
          });
        }
      }
    }

    return propertyNames;
  }
  schemaHelpers.getElementProperties = getElementProperties;

  var convertPropertiesToSchemaValues = function (properties) {
    var result = {
      schema: {
        properties: {}
      },
      values: {}
    },
      propDef,
      propObj;

    Object.keys(properties).forEach(function (property) {
      propObj = result.schema.properties[property] = {};
      propDef = properties[property];
      Object.keys(propDef).forEach(function (innerProp) {
        if (innerProp === 'value') {
          result.values[property] = propDef[innerProp];
        } else {
          propObj[innerProp] = propDef[innerProp];
        }
      });
    });

    return result;
  }

  var convertPolymerElementPropertyToAtCoreFormSchema = function (polymerElementPropertyName, polymerElementPropertyDefinition) {
    var
      propName = polymerElementPropertyName,
      propDef = polymerElementPropertyDefinition,
      schema = {
        title: propName,
        description: 'Settings for ' + propName,
        properties: {}
      },
      tmpDef,
      propSchemaDef = {
        type: '',
        xtype: '',
        title: '',
        required: false,
        disabled: false,
        default: ''
      },
      propertyNameIgnoreList = ["type", "value", "reflectToAttribute", "readOnly", "notify", "computed", "observer", "defined"];

    // polymer project property definition is found here
    // https://www.polymer-project.org/1.0/docs/devguide/properties.html
    // propDef can be a function or a object
    // if its a function create a tmpDef with propDef.type = propDef
    if (isFunction(propDef)) {
      tmpDef = {
        type: propDef
      };
    } else {
      // else work with tmpDef = propDef
      tmpDef = propDef;
    }
    // set title to be property name
    propSchemaDef.title = propName;
    // convert type function to type string
    var computedType = typeof tmpDef.type();
    if (computedType === "object") {
      if (isArray(tmpDef.type())) {
        computedType = "array";
      }
    }
    propSchemaDef.type = computedType;
    // convert value or value function to default
    var computedValue = tmpDef.value;
    if (notNull(tmpDef.value)) {
      if (isFunction(tmpDef.value)) {
        computedValue = tmpDef.value();
      }
      propSchemaDef.default = computedValue;
    }

    // copy over everything else, but ignore property names in propertyNameIgnoreList becase they do not make sense in at json schema
    var propertyNames = Object.keys(tmpDef);
    copyProperties(propertyNames, propertyNameIgnoreList, tmpDef, propSchemaDef);

    return propSchemaDef;
  };

  var copyProperties = function (propertyNames, ignoreList, source, destination) {
    propertyNames.forEach(function (propName, index) {
      
      if (ignoreList.indexOf(propName) !== -1) return;
      
      if (isNull(source[propName])) return;
      
      var readonly = false;
      if (destination.properties && destination.properties[propName]) {
        readonly = destination.properties[propName].readOnly === true;
      }
      if (readonly) return;
      
      try {
        destination[propName] = source[propName];
      } catch (e) {
        console.log(e);
      }
    });
  };
  schemaHelpers.copyProperties = copyProperties;
}(window.schemaHelpers = window.schemaHelpers || {}));
