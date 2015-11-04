import re

import yaml

from ..utils import APIError
from ..predefined_apps.models import PredefinedApp as PredefinedAppModel
from ..billing.models import Kube


class AppParseError(Exception):
    pass


class PredefinedApps(object):
    def __init__(self, user=None):
        if user is not None and not isinstance(user, int):
            user = user.id
        self.user = user

        self.apps = PredefinedAppModel.query.order_by(PredefinedAppModel.id)
        if self.user is not None:
            self.apps = self.apps.filter_by(user_id=self.user)

    def get(self, app_id=None):
        if app_id is None:
            return [app.to_dict() for app in self.apps]

        app = self.apps.filter_by(id=app_id).first()
        if app is None:
            raise APIError('Not found', status_code=404)
        return app.to_dict()

    def get_by_qualifier(self, qualifier):
        app = self.apps.filter_by(qualifier=qualifier).first()
        if app is None:
            raise APIError('Not found', status_code=404)
        return app.to_dict()

    def create(self, name, template, validate=False):
        if template is None:
            raise APIError('Template not specified')
        if validate:
            validate_template(template)
        app = PredefinedAppModel(
            user_id=self.user, name=name, template=template
        )
        app.save()
        return app.to_dict()

    def update(self, app_id, name, template, validate=False):
        app = self.apps.filter_by(id=app_id).first()
        if app is None:
            raise APIError('Not found', status_code=404)
        if validate:
            validate_template(template)
        if name is not None:
            app.name = name
        if template is not None:
            app.template = template
        app.save()
        return app.to_dict()

    def delete(self, app_id):
        app = self.apps.filter_by(id=app_id).first()
        if app is None:
            raise APIError('Not found', status_code=404)
        app.delete()


#:Custom variable pattern
# Everything in form '$sometext$' will be treated as custom variable definition
CUSTOM_VAR_PATTERN = re.compile(r'\$[^\$]+\$')
# Valid variable must be in form:
CORRECT_VARIABLE_FORMAT_DESCRIPTION = \
"$<VARIABLE_NAME|default:<word 'autogen' or some default value>|VAR_DESCRIPTION>$"
VARIABLE_PATTERN = \
    re.compile(r'^\$([^\|\$]+)\|default:([^\|\$]+)\|([^\|\$]+)\$$')


def validate_template(template):
    """Validates saving template text.
    Now checks:
        - validity of custom variables in template;
        - kube type. If it is specified, then it must be one of existing types.

    """
    check_custom_variables(template)
    try:
        parsed_template = yaml.safe_load(template)
    except (yaml.scanner.ScannerError, yaml.parser.ParserError):
        raise_validation_error(u'common', u'Invalid yaml format')
    try:
        app_root = find_root(parsed_template)
    except AppParseError as err:
        raise_validation_error(
            u'common', u'Invalid application structure: {}'.format(str(err))
        )
    if not isinstance(parsed_template, (dict, list)):
        raise_validation_error(
            u'common',
            u'Invalid yaml template: top level element must be list or dict'
        )
    check_kube_type(app_root)


def check_custom_variables(template):
    """Checks validity of custom variables in template.
    :param template: string with template content
    :raise: APIError in case of invalid variables.

    """
    custom_vars = find_custom_vars(template)
    if not custom_vars:
        return
    errors = []
    for var in custom_vars:
        if not VARIABLE_PATTERN.match(var):
            errors.append(var)
    if errors:
        raise_validation_error('customVars', errors)


def find_custom_vars(text):
    custom = CUSTOM_VAR_PATTERN.findall(text)
    return custom


def check_kube_type(app_root):
    """Checks validity of kube type in application structure.
    :param app_struct: dict or list for application structure.
    :raise: APIError in case of invalid kube type.

    """
    key = 'kube_type'
    if key not in app_root:
        return
    kube_type = app_root[key]
    _, value, _ = get_value(kube_type)
    try:
        value = int(value)
    except (TypeError, ValueError):
        raise_validation_error('values', {'kube_type': 'Invalid kube type'})
    kube = Kube.get_by_id(value)
    if not kube:
        raise_validation_error(
            'values', {'kube_type': 'Specified kube does not exist'})


def find_root(app_struct):
    try:
        if app_struct['kind'] == 'ReplicationController':
            return app_struct['spec']['template']['spec']
        if app_struct['kind'] == 'Pod':
            return app_struct['spec']
    except (TypeError, KeyError):
        pass
    raise AppParseError("Not found 'spec' section")


def get_value(value, strict=False):
    if not isinstance(value, basestring):
        if strict:
            AppParseError(u'Invalid custom variable: {}'.format(value))
        return (None, value, None)
    m = VARIABLE_PATTERN.match(value)
    if m is None:
        if strict:
            AppParseError(u'Invalid custom variable: {}'.format(value))
        return (None, value, None)
    varname, defaultvalue, description = m.groups()
    return (varname, defaultvalue, description)


def raise_validation_error(key, error):
    raise APIError({'validationError': {key: error}})
