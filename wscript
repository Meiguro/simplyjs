#
# This file is the default set of rules to compile a Pebble project.
#
# Feel free to customize this to your needs.
#

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

    def package_javascript(task):
        cmd = ['cat']
        cmd.extend([x.abspath() for x in task.inputs])
        cmd.extend(['>', task.outputs[0].abspath()])
        task.exec_command(' '.join(cmd))

    js_files = ctx.path.ant_glob('src/js/**/*.js')

    if js_files:
        ctx(rule=package_javascript,
            source=js_files,
            target=ctx.path.make_node('build/src/js/pebble-js-app.js'))

    ctx.pbl_bundle(elf='pebble-app.elf',
                   js=ctx.path.ant_glob('build/src/js/**/*.js'))

# vim:filetype=python
