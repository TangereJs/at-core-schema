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

  schemaHelpers.isObject = isObject;
  schemaHelpers.isString = isString;
  schemaHelpers.isArray = isArray;

  schemaHelpers.isNull = isNull;
  schemaHelpers.isNullOrEmpty = isNullOrEmpty;
  schemaHelpers.notNull = notNull;
  schemaHelpers.notNullOrEmpty = notNullOrEmpty;
  schemaHelpers.formatJson = formatJson;
  schemaHelpers.capitalize = capitalize;
  schemaHelpers.isFunction = isFunction;

  // ------------------------------------------------------------
  // initialize central array of components
  // ------------------------------------------------------------
  var centralArrayOfComponents = [];
  var initializeCentralArrayOfComponents = function () {
      var result = [];
      var registrations = Polymer.telemetry.registrations;
      registrations.forEach(function (registration, index) {
        if (registration.$meta && isArray(registration.$meta)) {
          var
          is = registration.is,
          meta = registration.$meta,
          newEntry;

          meta.forEach(function (entry, index) {
            if (isNull(entry.xtype)) {
              newEntry = {
                elementName: is,
                type: entry.type,
                title: entry.title
              };
              result.push(newEntry);
            } else {
              newEntry = {
                elementName: is,
                type: entry.type,
                xtype: entry.xtype,
                title: entry.title
              };
              result.push(newEntry);
            }
          });
        }
    });
    schemaHelpers.centralArrayOfComponents = centralArrayOfComponents = result;
  };

  schemaHelpers.initializeCentralArrayOfComponents = initializeCentralArrayOfComponents;
  initializeCentralArrayOfComponents();

  document.addEventListener('WebComponentsReady', function(event) {
    initializeCentralArrayOfComponents();
  });


  /**
   * Searches the central array of components for the mapping that has type === propertyType or xtype === propertyType
   * @function findMapping
   * @return {false|Object} false if mapping is not found; mapping object if mapping is found
   */
  var findMapping = function (propertyType) {
    var
      result = false,
      index,
      length = centralArrayOfComponents.length,
      mapping;

    for (index = 0; index < length; index++) {
      var mapping = centralArrayOfComponents[index];
      if (Boolean(mapping.xtype)) {
        if (mapping.xtype === propertyType) {
          result = mapping;
          break;
        }
      } else {
        if (mapping.type === propertyType) {
          result = mapping;
          break;
        }
      }
    }

    return result;
  }
  schemaHelpers.findMapping = findMapping;

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
    } else {
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
    }
    return displayType;
  }

  schemaHelpers.getDisplayType = getDisplayType;

  var createElement = function (propertyName, displayType, propertyDefinition) {
    var element;
    var label = notNull(propertyDefinition.title) ? propertyDefinition.title : capitalize(propertyName);
    var required = Boolean(propertyDefinition.required);
    var disabled = Boolean(propertyDefinition.disabled);
    var description = notNull(propertyDefinition.description) ? propertyDefinition.description : ' ';
    var mapping = findMapping(displayType);

    if (!propertyDefinition.title && propertyDefinition.description) {
      label = propertyDefinition.description;
    }

    if (!mapping) {
      console.log("Central array of components doesn't contain mapping for type " + displayType);
      console.log("Property name " + propertyName);
      console.log("Property definition: " + formatJson(propertyDefinition));
      console.log("Using mapping for type string instead");
      mapping = findMapping('string');
    }

    element = document.createElement(mapping.elementName);

    element.label = label;
    element.required = required;
    element.disabled = disabled;

    var propertyNames = getElementProperties(element);

    // ignore list is a list of properties that should not be copied using copy properties because they are
    // either already set in code above [ label,  required, disabled, title ]
    // should not be copied to element [ type, xtype, default ]
    // or never present in json schema [ value, valid ]
    // MPS-17 when mapping.elementName === 'at-form-lookup' [available, xvaluelist and enum are ignored ]
    var ignoreList = ["label", "value", "valid", "required", "disabled", "title", "type", "default", "available", "xvaluelist", "enum"];
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

    if (displayType === "enum" || displayType === "radio") {
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
      if (ignoreList.indexOf(propName) === -1) {
        if (notNull(source[propName])) {
          try {
            destination[propName] = source[propName];
          } catch (e) {
            console.log(e);
          }
        }
      }
    });
  }
  schemaHelpers.copyProperties = copyProperties;

}(window.schemaHelpers = window.schemaHelpers || {}));
