angular
  .module('lnPatterns')
  .factory('lnOGravityFormParser', lnOGravityFormParser);

/**
 *  TODO:
 *    - Render all 'Advanced' fields in the WP GF Form setup
 *    - Render all 'Post' fields in the WP GF Form setup
 *    - Render all 'Pricing' fields in the WP GF Form setup
 *
 *    - Add in paged form support
 *      - Render progress indicator if specified
 *      - Render Submit / Next buttons in page footers and not form footer if paged
 *      - Detect page number and use either Next or Submit button if it's the final page
 */

/*@ngInject*/
function lnOGravityFormParser($log, isValidParameterFilter) {
  var formTemplate = '' +
    '<div class="ln-o-gravity-form">' +
    '<div class="ln-o-gravity-form-header">' +
    '<h3 class="title">{{title}}</h3>' +
    '<span class="description">{{description}}</span>' +
    '</div>' +
    '<div class="ln-o-gravity-form-body">' +
    '{{body}}' +
    '</div>' +
    '<div class="ln-o-gravity-form-footer">' +
    '{{submit}}' +
    '</div>' +
    '</div>';

  var methodMap = {
    'text': parseInput,
    'number': parseInput,
    'hidden': parseInput,
    'textarea': parseTextarea,
    'radio': parseGroupInputList,
    'checkbox': parseGroupInputList,
    'select': parseSelectList,
    'multiselect': parseSelectList,
    'html': parseHTML,
    'section': parseSectionBreak,
    'email': parseEmail //,
    // TODO: implement the following input types
    /*
     'page' : parsePage,
     'name' : parseName,
     'date' : parseDate,
     'time' : parseTime,
     'phone' : parsePhone,
     'address' : parseAddress,
     'website' : parseWebsite,
     'fileupload' : parseFileupload,
     'list' : parseList,
     'post_title' : parsePostTitle,
     'post_content' : parsePostContent,
     'post_excerpt' : parsePostExcerpt,
     'post_tags' : parsePostTags,
     'post_category' : parseCategory,
     'post_image' : parseImage,
     'post_custom_field' : parseCustomField,
     'product' : parseProduct,
     'quantity' : parseQuantity,
     'option' : parseOption,
     'shipping' : parseShipping,
     'total': parseTotal
     */
  };

  // Public API
  //

  return {
    parse: parse
  };

  function parse(data) {
    $log.debug('lnOGravityFormParser.parse() ->', data.response);

    if (angular.isUndefined(data.response)) {
      $log.error('lnOGravityFormParser.parse() -> Form data unavailable!');
      return;
    }

    return angular
      .copy(formTemplate)
      .replace(/{{title}}/gi, data.response.title)
      .replace(/{{description}}/gi, data.response.description)
      .replace(/{{body}}/gi, parseAllFields(data.response.fields))
      .replace(/{{submit}}/gi, parseSubmitButton(data.response.button.text));
  }


  // Internal
  //

  function parseAllFields(fieldsData) {
    var _fields = '<ul class="fields">';

    angular.forEach(fieldsData, function (field) {
      var _fieldHTML;
      var _labelHTML;
      var _method = methodMap[field.type];

      field.hidden = false;
      field.hasLabel = true;

      if (angular.isDefined(_method)) {
        _fieldHTML = _method(field);

        if (!field.hidden && field.hasLabel) {
          _labelHTML = parseLabel(field.modifiedId, field.label, field.isRequired);
        } else {
          _labelHTML = '';
        }

        _fields += parseField(_fieldHTML, _labelHTML, field.hidden, field.formId, field.id);
      } else {
        $log.debug('lnOGravityFormParser.parseAllFields() -> Unsupported field type: ', field.type);
      }
    });

    _fields += '</ul>';

    return _fields;
  }

  function parseField(fieldHTML, labelHTML, isHidden, formId, fieldId) {
    return '<li class="field{{hidden}}" id={{id}}>{{label}}{{field}}</li>'
      .replace(/{{hidden}}/gi, isHidden ? ' ng-hide' : '')
      .replace(/{{id}}/gi, 'field_' + formId + '_' + fieldId)
      .replace(/{{label}}/gi, labelHTML)
      .replace(/{{field}}/gi, fieldHTML);
  }


  // Utility
  //

  function parseLabel(isFor, text, required) {
    return '<label for="{{for}}">{{text}}{{required}}</label>'
      .replace(/{{for}}/gi, isFor)
      .replace(/{{text}}/gi, text)
      .replace(/{{required}}/gi, required === true ? parseRequiredFlag() : '');
  }

  function parseRequiredFlag() {
    return '<span>*</span>';
  }


  // Submit / Next button
  //

  function parseSubmitButton(text) {
    return '<button type="submit" ng-disabled="!$ctrl.form.$valid" class="submit">{{text}}</button>'
      .replace(/{{text}}/gi, text || 'Submit');
  }


  // Standard
  //

  function parseInput(data) {
    data.hidden = data.type === 'hidden';

    data.modifiedId = 'input_' + data.formId + '_' + data.id;
    data.name = isValidParameterFilter(data.name) ? data.name : 'input_' + data.id;
    data.value = isValidParameterFilter(data.value) ? data.value : '';

    return '<input type="{{type}}" name="{{name}}" id="{{id}}" value="{{value}}" {{required}} placeholder="{{placeholder}}" class="{{hidden}}">'
      .replace(/{{type}}/gi, data.type)
      .replace(/{{id}}/gi, data.modifiedId)
      .replace(/{{name}}/gi, data.name)
      .replace(/{{value}}/gi, data.value)
      .replace(/{{placeholder}}/gi, data.placeholder)
      .replace(/{{required}}/gi, data.isRequired ? 'required' : '')
      .replace(/{{selected}}/gi, data.isSelected)
      .replace(/{{hidden}}/gi, data.hidden ? 'ng-hide' : '');
  }

  function parseTextarea(data) {
    data.modifiedId = 'input_' + data.formId + '_' + data.id;
    data.name = isValidParameterFilter(data.name) ? data.name : 'input_' + data.id;
    data.value = isValidParameterFilter(data.value) ? data.value : '';

    return '<textarea name="{{name}}" id="{{id}}" placeholder="{{placeholder}}" value="{{value}}"></textarea>'
      .replace(/{{name}}/gi, data.name)
      .replace(/{{id}}/gi, data.modifiedId)
      .replace(/{{value}}/gi, data.value)
      .replace(/{{placeholder}}/gi, data.placeholder)
      .replace(/{{required}}/gi, data.isRequired);
  }

  function parseGroupInputList(data) {
    data.modifiedId = 'input_' + data.formId + '_' + data.id;

    var _list = '<ul id="' + data.modifiedId + '">';
    var _index = (data.type === 'checkbox') ? 1 : 0;
    var _nameHasIndexSuffix = (data.type === 'checkbox');

    angular.forEach(data.choices, function (choice) {
      choice.type = data.type;
      choice.modifiedId = 'choice_' + data.formId + '_' + data.id + '_' + _index;
      choice.name = 'input_' + data.id;

      if (_nameHasIndexSuffix === true) {
        choice.name += '.' + _index;
      }

      _list += '<li>'
        + parseGroupInput(choice)
        + parseLabel(choice.modifiedId, choice.text, false)
        + '</li>';

      _index += 1;
    });

    _list += '</ul>';

    return _list;
  }

  function parseGroupInput(data) {
    return '<input type="{{type}}" id="{{id}}" name="{{name}}"  value="{{value}}" {{checked}}>'
      .replace(/{{type}}/gi, data.type)
      .replace(/{{id}}/gi, data.modifiedId)
      .replace(/{{name}}/gi, data.name)
      .replace(/{{value}}/gi, data.value)
      .replace(/{{checked}}/gi, data.isSelected === true ? 'checked' : '');
  }

  function parseSelectList(data) {
    data.modifiedId = 'input_' + data.formId + '_' + data.id;
    data.name = 'input_' + data.id;
    data.isMultiple = data.type === 'multiselect';

    if (data.isMultiple) {
      data.name += '[]';
    }

    var _list = '<select {{multiple}} name="{{name}}" id="{{id}}">';

    angular.forEach(data.choices, function (choice) {
      _list += parseSelectOption(choice);
    });

    _list += '</select>';

    return _list
      .replace(/{{multiple}}/gi, data.isMultiple ? 'multiple="multiple"' : '')
      .replace(/{{name}}/gi, data.name)
      .replace(/{{id}}/gi, data.modifiedId);
  }

  function parseSelectOption(data) {
    return '<option value="{{value}}" {{selected}}>{{text}}</option>'
      .replace(/{{value}}/gi, data.value)
      .replace(/{{selected}}/gi, data.isSelected === true ? 'selected="selected"' : '')
      .replace(/{{text}}/gi, data.text);
  }

  function parseSectionBreak(data) {
    data.hasLabel = false;
    return '<h2>{{label}}</h2>'
      .replace(/{{label}}/gi, data.label);
  }

  function parseHTML(data) {
    data.hasLabel = false;
    return data.content;
  }


  // Advanced

  // NOTE: This is currently implemented as a standard input, but actually has it's own type in the GF Admin,
  // So may need to add in extra logic here.
  function parseEmail(data) {
    return parseInput(data);
  }
}