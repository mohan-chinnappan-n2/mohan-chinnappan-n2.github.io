## EA discovery
- Using Einstein Discovery is like having a personal data scientist doing the heavy lifting to speed up your work.
- Every dataset tells a story. But it’s difficult to excavate that story when you’re dealing with **enormous tables of data and many variables with complex relationships**.
    - Example:   shrinking margins in an auto parts supply company. 
        - To do a thorough analysis, you need to consider not just inventory, but also particular **markets, distributors, incentives, and likely many other factors**.
- analyzes huge amounts of data to expose correlations that we can investigate
- shows us where to look for solutions, and predicts what might happen based on these correlations.



### Videos

- [Einstein Analytics - Discovery](https://www.youtube.com/watch?v=Ev895wkofX4)
- [Trailhead](https://trailhead.salesforce.com/en/content/learn/modules/wave_exploration_smart_data_discovery_basics/wave_smart_data_discovery_your_data_scientist)
- [Overview](https://www.salesforce.com/products/einstein-analytics/overview/)
- [EA Dev org](https://developer.salesforce.com/promotions/orgs/analytics-de)
- [EA Discovery Stories](https://trailhead.salesforce.com/en/content/learn/modules/understand_einstein_discovery_stories/use_stories)

### Key points

- quickly sift through huge amounts of data (EA dataset) to find:
    -  the important correlations 
    -  make accurate predictions
-  generates answers, explanations, and recommendations in a way that is easy for business users to understand

- finds the patterns
    - What was significant or unusual?
    - Why did it happen? What are the factors that possibly contributed to the observed outcome?
    - How do some factors compare with other factors?
    - What might happen in the future, based on a **statistical analysis** of the data?
        - Is there a trend, or does this data represent an isolated one-off incident?
    - Actions
        - What are some possible actions that could improve the outcome?


### Example
- what’s driving profitability by figuring out ways in which we can improve margin

- Use case:
    - The company’s CFO started it to find out why, all of a sudden, company margins are headed south. Then the CEO chimes in: “We must solve this issue immediately!”
    - input: transactions across different regions and verticals

- How to:
     - open up Analytics Studio, grab the Einstein Analytics dataset that contains the relevant data
     - tell it the variable (business metric) you want to learn about.
     - Minutes later, you get a story:
        - represents a comprehensive **statistical analysis** of your dataset.
        - provides insights about your data that pertain to the outcome variable you're interested in (margin)
        - possible underlying causes and relationships among possible influencers
        - anticipates what to expect next based on a predictive analysis of your dataset
        - suggests ways in which you might improve the outcome.
        - ![EAD](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/wave_exploration_smart_data_discovery_basics/wave_smart_data_discovery_your_data_scientist/images/6124e85ac216ddf21fa8ef9962b73721_sdd_wave_scientist_saves_the_day_story_example.png)


### Steps
- In EA, Create > Dataset
![Dataset creation-1](img/ead-1.png)
![Dataset creation-2](img/ead-2.png)
![Dataset creation-3](img/ead-3.png)

- What Happened to Our Margins?

- Create Story for the dataset APDist
![Story creation-1](img/ead-create-story-1.png)
- Based on the data in your dataset, Einstein Discovery suggests creating a story to “Maximize the variable Margin.” 
![Story creation-2](img/ead-create-story-2.png)
-  How do I maximize margins? And that question lines up with the most pressing question you have: What happened to lower our margins?

- Click [Data Options]. In the next screen, you tell Einstein which fields to use to create the story.
![Story creation-3](img/ead-create-story-3.png)
- You can de-select fields that you don't want used in the story. In this case, you want to use every field, so leave this page as it is.

![Story creation-4](img/ead-create-story-4.png)

### Results
![Discovery Results](img/ead-create-story-demo-1.gif)

![Discovery Results 2](img/ead-create-story-demo-2.gif)

### Get the Big Picture from Stories

- AcquiredAccount.csv  has  11 columns: Account Id, BillingState, Division, Industry, Ownership, Rating, Type, AccountScore, StartDate, CloseDate, and CLV(Customer lifetime value). The CSV file contains one row of information for each of the 10,000 different companies that our auto parts manufacturing company does business with. Here is what the first few rows of the CSV file look like:
![AcquiredAccount.csv](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/understand_einstein_discovery_stories/use_stories/images/6fdb8d53d92d991653235545ac93e98c_csv_table.png)

- Customer lifetime value (CLV) is a metric that predicts the profitability over the entire lifetime of the company’s relationship with a customer.
- CLV helps to  find the group of customers who are potentially the most profitable. That way, more marketing resources can be allocated to them.

- Goals: maximizing margin or minimizing cost
- Result: answers, explanations, and recommendations arranged into an organized presentation with a logical flow and related sections
- Provides insights about your data and the variables you're interested in

##### What Happened - insights
- descriptive insights that tell you more about what happened according to the data in the dataset.

- explains statistically, the most variation in the outcome variable. 
-  uses bar charts to help you visualize What Happened insights.

- CLV is the outcome variable in your story, and maximizing CLV is your goal. 

- All the insights in this story show you how **different variables and combinations of variables** explain variations in CLV. 

-  The top insights in the list reflect the most statistically significant variations in the outcome variable.

- T-Test:
    - For each category in the Einstein Analytics dataset, Einstein Discovery performs a statistical calculation called a t-test to find out whether the category is **statistically significant**.
    - The t-test helps to identify categories that exhibit patterns that are statistically different from the other categories. 
    - For example, for the category called Naval, the first step is to split the data into two groups: **Naval and not Naval**. The second step is to use the t-test to determine whether these two groups are statistically different.

    - What is t-test? 
        - invented by William Sealy Gosset
        - [paper](img/probable-error-of-a-mean.pdf)
        -   checks if 2 means (averages) are reliably different from each other
        - it is an inferential statistics (instead descriptive statistics)
            - Not only describe our sample but also tell us about new samples that we do not have even
            - So allow us to take inferences (generalize the findings ) about whole population beyond our data we have
            - t = (variance between groups) / (variance within the group)
                - big t value : different groups
                - small t value :   similar groups
            ![t-value](img/t-value-1.png)
            - refer [StatsCast: What is a t-test?](https://www.youtube.com/watch?v=0Pd3dc1GcHc)
            - refer[Student's t-test](https://www.youtube.com/watch?v=pTmLQvMM-1M)
            - refer[T-test using Python and Numpy](https://towardsdatascience.com/inferential-statistics-series-t-test-using-numpy-2718f8f9bf2f)
    - Division is the variable that explains the most variation in CLV. 
    - This type of insight, called a **first-order analysis**, examines how one variable (Division) explains variation in the outcome variable (CLV).

    - The key takeaway from this insight is that Division explains 14.2% of the variation in CLV. Einstein Discovery did a statistical calculation to find the coefficient of determination, R2 (R squared). R2 tells you how much Division explains variation of the outcome variable (CLV)—in other words, how much predictive power the Division variable has. More observations describe other factors that affect CLV.

![first-order analysis](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/understand_einstein_discovery_stories/understand_descriptive/images/25a267238d989aefec9fdc186833501b_what_happened_graph.png)


- CLV is the vertical axis and Division is the horizontal axis.
The orange horizontal line in the chart shows the average CLV, which is just above 20 K.
- Blue bars show variables that extend further above and below the average CLV—the most interesting correlations. Of these divisions, Raw Materials and Mapping are the most significantly above average, and Standard Hardware is the most significantly below average.
- Gray bars show variables that are close to the average CLV. These divisions are statistically less significant and, therefore, are not listed in the explanatory text on the left. When considering gray bars, you can't assume that the differences from the other categories is meaningful.

![hove info](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/understand_einstein_discovery_stories/understand_descriptive/images/640bb851a3f9ae4f05f2732a53f06be4_what_happened_hover.png)

![std dev](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/understand_einstein_discovery_stories/understand_descriptive/images/0d8baf378914558c5aade3a134864234_what_happened_stddev.png
)
- In the blue curve, notice that more of the values are closer to the average. It has a smaller standard deviation. In the yellow curve, the values are more spread out, and therefore it has a larger standard deviation.

![Discovery Results 3](img/ead-create-story-demo-3.gif) 

#### View a Second-Order Analysis


- This is a refinement of the first insight discussed previously, CLV by Division. It adds a second variable, When Type is Consulting, meaning that the combination of the two variables (CLV is Division and Type is Consulting) gives a strong signal. 

![2nd order](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/understand_einstein_discovery_stories/understand_descriptive/images/67ee44c306d069adbdc0aeadc953f1fd_what_happened_second_chart.png)

- Notice that what stands out first in the chart is the blue bar above Naval, which shows that Consulting is highest when Division is Naval.

![2nd - 2](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/understand_einstein_discovery_stories/understand_descriptive/images/427a456ed5b56d984b28f9c4aff4df98_what_happened_second_retail.png)


- There are two bars for each division. The bar on the left represents the division's average value when only the retail industry is included. The bar on the right represents the average value for the division when all industries except retail are included. Comparing these bars lets you see how differently this pairing behaves.

- The reason that Einstein Discovery flags this insight is that this particular industry, Retail, behaves differently from the rest of the population, with regard to Division. In this case, each bar refers to a Division when Industry is Retail. When we compare each division against the rest of the population, we compare that division in the retail industry versus that division in all other industries. If those two groups are statistically different, the bar is highlighted in blue.

![hover 2](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/understand_einstein_discovery_stories/understand_descriptive/images/7344c0eb404ef3c883fbf9207ec3996d_what_happened_second_retail_hover.png)

- 2,450: that is the difference between Standard Hardware when Industry is Retail and Standard Hardware in all other industries.

#### CLV by type
![clv by type](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/understand_einstein_discovery_stories/understand_descriptive/images/a670dc6d1c5598ee6ffc2893119b2e38_what_happened_clv_type.png)

### What Is The Difference insights 

- are comparative insights that help you better understand the relationships between explanatory variables and the goal (target outcome variable) in your story.

- help you figure out which factors contribute to the biggest changes in the outcome variable. 

![what is the diff](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/understand_einstein_discovery_stories/understand-what-is-the-difference-insights/images/88cd83d0d58e3218aa1b5b46ef970776_what_difference_dropdown.png)




![wisd](img/what-is-diff-1.png)

- It is useful to compare the CLV of a single variable with the global CLV average. 

![most statistically significant insights](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/understand_einstein_discovery_stories/understand-what-is-the-difference-insights/images/94febee29e8652567b92e4e45f661683_what_difference_global.png)

![drivers of CLV](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/understand_einstein_discovery_stories/understand-what-is-the-difference-insights/images/90cfbf1a2be1e3fc7d81e589e226ba59_what_difference_bar_hover_gray.png)




- Compare Two Variables


![c2v](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/understand_einstein_discovery_stories/understand-what-is-the-difference-insights/images/4c4a02d4d26d8050717c2ce99cad8031_what_difference_between.png)

![c2v2](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/understand_einstein_discovery_stories/understand-what-is-the-difference-insights/images/428423b4713fce8395321b59edd07098_what_difference_compare_two.png)

![hover](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/understand_einstein_discovery_stories/understand-what-is-the-difference-insights/images/215590501fd0c652bfaca68707a8b0bb_what_difference_compare_two_gray.png)

- Add a Filter

Optionally, you can add a filter to further focus your analysis on a subset of the data. On the far right side of the Insights navigation bar, click Search story insights and choose Type - Consulting.

![filter](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/understand_einstein_discovery_stories/understand-what-is-the-difference-insights/images/f557208d3568b67e7c286138e62ece09_what_difference_filter.png)

![results of filter](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/understand_einstein_discovery_stories/understand-what-is-the-difference-insights/images/064d89f64cdddd171b7b0ff7708005b4_what_difference_compare_two_filter.png)


