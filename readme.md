# Teambox

provides an overview of your teambox entries.

## Install / Register / Usage

1. Install the script globally (if you dont have administration permissions you should use it with `sudo`)
    `npm install teambox -g`
2. Register the teambox with `teambox register <DOMAIN> <MAID> <USERNAME> <PASSWORD> [force]`
    - the force argument is optional and overwrites the current configuration

3. Just call `teambox` and you get an summary of your current booked items.


## Months

to go back in time you can set the month by calling `teambox month 5` 

> starting with 1 (jan) to 12 (dec)


## List

to get also a complete list of all the entries, just call `teambox list`

if you would like to see a list of a former month, it's possible to add the month number like `teambox list 7`

## Ignore

to ignore workdays you can use the `teambox ignore add <yyyy-mm-dd>` command. For know it excludes weekends and holidays but not you sick days or vacations.

with `teambox ignore ls` you are able to list the ignored days

with `teambox ignore rm <yyyy-mm-dd>` you are able to remove a date from the ignore list