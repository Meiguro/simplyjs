from waflib.Configure import conf

top = '.'
out = 'build'

def options(ctx):
    ctx.load('pebble_sdk')

def configure(ctx):
    ctx.load('pebble_sdk')

def build(ctx):
    ctx.load('pebble_sdk')

    ctx.pbl_program(source=ctx.path.ant_glob('src/**/*.c'),
                    cflags=['-Wno-type-limits',
                            '-Wno-address'],
                    target='pebble-app.elf')

    js_target = ctx.concat_javascript(js=ctx.path.ant_glob('src/js/**/*.js'))

    ctx.pbl_bundle(elf='pebble-app.elf',
                   js=js_target)

@conf
def concat_javascript(self, *k, **kw):
    js_nodes = kw['js']

    if not js_nodes:
        return []

    def concat_javascript_task(task):
        cmd = ['cat']
        cmd.extend(['"{}"'.format(x.abspath()) for x in task.inputs])
        cmd.extend(['>', "{}".format(task.outputs[0].abspath())])
        task.exec_command(' '.join(cmd))

    js_target = self.path.make_node('build/src/js/pebble-js-app.js')

    self(rule=concat_javascript_task,
        source=js_nodes,
        target=js_target)

    return js_target

# vim:filetype=python
