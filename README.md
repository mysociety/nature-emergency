# Nature Emergency Declarations

## Use it online

Visit <https://mysociety.github.io/nature-emergency>.

All modern browsers are supported. Internet Explorer is not. See `.browserlistrc` for details.

## Running locally

Requirements:

- [Ruby](https://www.ruby-lang.org/en/documentation/installation/)
- [Bundler](https://bundler.io/#getting-started)

Install all dependencies and get a local server running immediately, in one command:

    script/server

The site will be available at both <http://localhost:4000> and <http://0.0.0.0:4000>.

If you want to serve locally over SSL (recommended) then generate self-signed SSL certificates with:

    script/generate-ssl-certificates

Once the SSL certificates are in place, `script/server` will serve the site over HTTPS, at both <https://localhost:4000> and <https://0.0.0.0:4000>. (You will need to tell your web browser to accept the self-signed certificate.)

You can build the site to `_site` (without serving it) with:

    script/build

## Generating data

Data is generated by two Python scripts in `script/`. Before running them, you’ll need to install their dependencies, eg:

    python3 -m venv .venv
    . .venv/bin/activate
    pip install --upgrade pip
    pip install -r dev-requirements.txt
    shot-scraper install

You can then re-generate `_data/councils.csv` by running `script/generate-councils` over a HTML export of the spreadsheet collated by Climate Emergency UK, eg:

    script/generate-councils --in path/to/google/sheet.html --out _data/councils.csv

`_data/similarities.csv` is a simplified version of mySociety’s [Local Authority Composite Similarity dataset](https://pages.mysociety.org/local-authority-similarity/datasets/composite_distance/latest), with GSS codes replacing three-letter-codes, and only the _most_ similar “B” councils included for each “A” council. It was generated by `script/generate-similarities`, eg:

    script/generate-similarities --out _data/similarities.csv

Whenever you (re-)generate `_data/councils.csv` you will also want to regenerate all of the social sharing preview images (this takes around 3½ minutes to run, 2 councils per second):

    script/generate-social-previews --start-server

The `--start-server` flag tells `script/generate-social-previews` to run its own internal server at 0.0.0.0:4000 so you’ll want to make sure that port is available for it to use. If not, you can run a server separately, and tell the script where to find it. See `script/generate-social-previews --help` for documentation on how to override the default server address, CSV input path, and image output path.

You will likely also want to compress the PNGs once they’ve been generated (eg: pngquant, at 80% quality, and Zopfli results in a ~65% filesize saving).
